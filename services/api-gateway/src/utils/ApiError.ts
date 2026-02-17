// TODO : improve the error response ( read medium doc on this ) 
// something like : {
//     success: 
//     error: {
//         statusCode:
//         message: 
//     }
// }
export class ApiError extends Error {
    public statusCode: number;
    public success: boolean;
    public errors: any[];

    constructor(statusCode: number, message: string = "Something went wrong", errors: any[] = [], stack: string = "") {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.message = message;
        this.errors = errors;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}