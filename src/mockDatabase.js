// Mock database for development when Firebase isn't available
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, '../../data.json');

let data = { users: [] };

// Load data from file if it exists
try {
  if (fs.existsSync(dataFile)) {
    const fileData = fs.readFileSync(dataFile, 'utf8');
    data = JSON.parse(fileData);
  }
} catch (error) {
  console.log('No existing data file, starting fresh');
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

export const mockDatabase = {
  users: {
    where(field, operator, value) {
      return {
        limit: (count) => {
          const filtered = data.users.filter(user => {
            if (operator === '==') {
              return user[field] === value;
            }
            return false;
          });
          return {
            get: async () => ({
              empty: filtered.length === 0,
              docs: filtered.slice(0, count).map(user => ({
                id: user.id,
                data: () => user
              }))
            })
          };
        }
      };
    },
    
    doc(id) {
      return {
        id: id || Date.now().toString(),
        set: async (userData) => {
          const user = { id: this.id, ...userData };
          data.users.push(user);
          saveData();
          return user;
        }
      };
    }
  }
};
