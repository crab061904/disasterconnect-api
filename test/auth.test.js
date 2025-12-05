import request from 'supertest';
import app from '../src/app.js';
import { firestore } from '../src/firebaseAdmin.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Test data
const testUser = {
  email: 'testuser@example.com',
  password: 'Test@1234',
  name: 'Test User',
  role: 'civilian',
  profileData: {
    phone: '+1234567890',
    address: '123 Test St, Test City'
  }
};

const testVolunteer = {
  email: 'volunteer@example.com',
  password: 'Volunteer@123',
  name: 'Test Volunteer',
  role: 'volunteer',
  profileData: {
    skills: ['first-aid', 'cpr'],
    availability: true
  }
};

const testOrganization = {
  email: 'org@example.com',
  password: 'Org@1234',
  name: 'Test Organization',
  role: 'organization',
  profileData: {
    orgName: 'Test Org Inc.',
    orgType: 'NGO',
    contactPerson: 'John Doe'
  }
};

describe('Authentication API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Clean up test data if it exists
    const usersSnapshot = await firestore.collection('users')
      .where('email', 'in', [testUser.email, testVolunteer.email, testOrganization.email])
      .get();
    
    const batch = firestore.batch();
    usersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new civilian user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user.roles).toContain('user');
      
      // Save token and user ID for subsequent tests
      authToken = res.body.token;
      userId = res.body.user.uid;
    });

    it('should register a volunteer user with additional role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testVolunteer);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.user.roles).toContain('user');
      expect(res.body.user.roles).toContain('volunteer');
      expect(res.body.user.isVolunteer).toBe(true);
    });

    it('should register an organization', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testOrganization);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.user.roles).toContain('organization');
      expect(res.body.user.roles).not.toContain('user');
    });

    it('should not register with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toContain('already registered');
    });

    it('should not register with invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'invalidrole@example.com',
          role: 'invalid-role'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Invalid role selection');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', testUser.email);
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword'
        });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toContain('User not found');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('roles');
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/auth/profile');
      
      expect(res.statusCode).toEqual(401);
    });

    it('should not get profile with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('PATCH /api/auth/users/:userId/roles', () => {
    let adminToken;
    
    beforeAll(async () => {
      // Create an admin user for testing role updates
      const adminUser = {
        email: 'admin@example.com',
        password: 'Admin@1234',
        name: 'Admin User',
        role: 'civilian',
        roles: ['admin', 'user']
      };
      
      // Create admin user in the database
      const userDoc = firestore.collection('users').doc();
      const passwordHash = await bcrypt.hash(adminUser.password, 10);
      await userDoc.set({
        ...adminUser,
        uid: userDoc.id,
        passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Generate token for admin
      adminToken = jwt.sign(
        { 
          uid: userDoc.id, 
          email: adminUser.email, 
          roles: adminUser.roles 
        },
        process.env.JWT_SECRET || 'change-me',
        { expiresIn: '1h' }
      );
    });

    it('should update user roles with admin privileges', async () => {
      const res = await request(app)
        .patch(`/api/auth/users/${userId}/roles`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roles: ['user', 'volunteer'],
          isVolunteer: true
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.roles).toContain('volunteer');
      expect(res.body.isVolunteer).toBe(true);
    });

    it('should not update roles without admin privileges', async () => {
      const regularUserToken = jwt.sign(
        { 
          uid: 'regular-user', 
          email: 'regular@example.com', 
          roles: ['user'] 
        },
        process.env.JWT_SECRET || 'change-me',
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .patch(`/api/auth/users/${userId}/roles`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          roles: ['user', 'volunteer']
        });
      
      expect(res.statusCode).toEqual(403);
    });
  });

  describe('POST /api/auth/google', () => {
    it('should authenticate with valid Google token', async () => {
      // Note: This is a simplified test. In a real scenario, you'd mock the Google OAuth flow
      const mockGoogleUser = {
        email: 'googletest@example.com',
        name: 'Google Test User',
        picture: 'https://example.com/photo.jpg',
        email_verified: true
      };

      // In a real test, you would mock the Google OAuth response
      // This is just a placeholder to show the test structure
      const res = await request(app)
        .post('/api/auth/google')
        .send({
          credential: 'mock-google-id-token',
          clientId: 'mock-client-id'
        });
      
      // This would be adjusted based on your actual Google auth implementation
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });
  });
});
