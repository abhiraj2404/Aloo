interface IApiError extends Error {
    statusCode: number;
    errors?: any;
}

// TODO : improve the error response ( read medium doc on this ) 
// something like : {
//     success: 
//     error: {
//         statusCode:
//         message: 
//     }
// }
export class ApiError extends Error implements IApiError {
    public statusCode: number;
    public errors?: any;
    public success: boolean;

    constructor(statusCode: number, message: string, errors?: any) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.success = false;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}