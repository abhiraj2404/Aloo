interface IApiError extends Error {
    statusCode: number;
    errors?: any;
}

export class ApiError extends Error implements IApiError {
    public statusCode: number;
    public errors?: any;

    constructor(statusCode: number, message: string, errors?: any) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.errors = errors;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}