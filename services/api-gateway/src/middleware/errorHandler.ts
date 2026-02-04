import logger from "../utils/logger.js";
const errorHandler = async(err: any, req: any, res: any, next: any) => {

    //for server 
    //console.error("Global error handler caught:",err);
    logger.error(err.message);


    const errorDetails = {
        message: err.message,
        stack: err.stack,
        success: err.success,
        path: req.originalUrl,
        method: req.method,
        time: new Date()
    }


    console.log("Error details from global error middleware", JSON.stringify(errorDetails, null, 2));

    //here we can persist error into db



    // Check if headers have already been sent to avoid "Can't set headers after they are sent" errors
    if (res.headersSent) {
        return next(err); // Pass to default Express error handler if response already started
    }


    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal server error!";

    res.status(statusCode).json({
        success: false,
        message,
        errors:err.errors || null
    })


}

export default errorHandler;