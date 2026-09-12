const express = require("express");
const app = express();
const cookieParser = require("cookie-parser")

/**
 * - Routes Required
 */

const authRouter = require("../src/routes/auth.routes");
const accountRouter = require("../src/routes/account.routes")
const transactionRoutes = require("../src/routes/transaction.routes")

app.use(express.json());
app.use(cookieParser());

/**
 * User Routes
 */

app.get("/", (req, res) => {
    console.log("Ledger Service is up and running")
     res.status(200).send("Ledger Service is up and running");
})

app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes); 

module.exports = app;
