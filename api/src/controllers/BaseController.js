// Base controller class with common functionality
export class BaseController {
	// Common success response
	static success(res, data, message = "Success", statusCode = 200) {
		return res.status(statusCode).json({
			success: true,
			message,
			data
		});
	}

	// Common error response
	static error(res, message = "Internal server error", statusCode = 500, details = null) {
		console.error(`Controller Error [${statusCode}]:`, message, details);
		return res.status(statusCode).json({
			success: false,
			error: message,
			...(details && { details })
		});
	}

	// Validation helper
	static validateRequired(body, requiredFields) {
		const missing = requiredFields.filter(field => !body[field]);
		return missing.length > 0 ? `Missing required fields: ${missing.join(", ")}` : null;
	}

	// Async error handler wrapper
	static asyncHandler(fn) {
		return (req, res, next) => {
			Promise.resolve(fn(req, res, next)).catch(next);
		};
	}
}
