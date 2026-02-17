import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/logger.js";
const errorHandler = async(error: any, req: any, res: any, next: any) => {

    logger.error(error.message);

    if(!(error instanceof ApiError)){
        const statusCode = error.statusCode || 500;
        const message = error.message || "Internal Server Error"
        error = new ApiError(statusCode, message, [], error.stack)
    }

    // TODO : improve the error response ( read medium doc on this ) 
    // something like : {
    //     success: 
    //     error: {
    //         statusCode:
    //         message: 
    //     }
    // }


    res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors:error.errors,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    })


}

export default errorHandler;