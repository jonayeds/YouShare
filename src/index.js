import dotenv from "dotenv"
import connectDB from "./db/index.js" 

dotenv.config({
    path:"./" 
})


connectDB()





























// import express from "express"
// const app = express()
// ;(async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_uri}/${DB_NAME}`)
//         app.on("error", (error)=>{
//             console.log("ERR:", error)
//             throw error
//         })
//         app.listen(process.env.PORT, ()=>{
//             console.log("App is running on port ", process.env.PORT)
//         })
//     }
//     catch (error){
//         console.log(error)
//         throw error
//     }
// })()
