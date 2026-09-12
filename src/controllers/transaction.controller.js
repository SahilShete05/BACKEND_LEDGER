const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const emailService = require("../services/email.service");
const accountModel = require("../models/account.models")
const mongoose = require("mongoose");
const userModel = require("../models/user.model");

/**
 * Create a new transaction
 * THE 10 - STEP TRANSFER FLOW:
 * 1. Validate request
 * 2. Validate idempotency key
 * 3. Check account status
 * 4. Derive sender balance from ledger
 * 5. Create transaction (PENDING)
 * 6. Create DEBIT ledger entry
 * 7. Create CREDIT ledgeer entry
 * 8. Make transation (COMPLETED)
 * 9. Commit MongoDB session
 * 10. Send email notification
 */


async function createTransaction(req, res) {

   /**
    * 1. Validate request
    */
    const{ fromAccount, toAccount, amount, idempotencyKey} = req.body;

    if(!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message:"fromAccount, toAccount, amount, idempotencyKey are requried"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id:fromAccount
    })

     const toUserAccount = await accountModel.findOne({
        _id:toAccount
    })

    if(!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message:"Invalid fromAccount or toAccount"
        })
    }

    /**
     * 2. Validate idempotency key
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey:idempotencyKey
    })

    if(isTransactionAlreadyExists) {
        if(isTransactionAlreadyExists == "COMPLETED") {
            return res.status(200).json({
                message:"Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }

        if(isTransactionAlreadyExists == "PENDING") {
            return res.status(200).json({
                message:"Transaction is in progress"
            })
        }

        if(isTransactionAlreadyExists == "FAILED") {
            return res.status(500).json({
                message:"Transaction processing failed, please retry"
            })
        }

        if(isTransactionAlreadyExists == "REVERSED") {
            return res.status(500).json({
                message:"Transaction was reversed, please retry"
            })
        }
    }

    /**
     * 3. Check account status
     */

    if(fromUserAccount.status != "ACTIVE" || toUserAccount.status != "ACTIVE") {
        return res.status(400).json({
            message:"Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }


    /**
     * 4. Derive sender balance from ledger
     */

    const balance =  await fromUserAccount.getBalance()

    if(balance < amount ) {
        return res.status(400).json({
            message:`Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
        })
    }

    let transaction;
    try {

    
    /**
     * 5. Create transaction (PENDING)
     */

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = (await transactionModel.create([{
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }], { session } )) [0]
  
    /**
     * 6. Create DEBIT ledger entry
     */
    const debitLedgerEntry = await ledgerModel.create([{
        account: fromAccount,
        amount,
        transaction: transaction._id,
        type:"DEBIT"
    }], { session })


    await ( () => {
        return new Promise( (resolve) => setTimeout (resolve, 15 * 1000))
    }) ()

    /**
     * 7. Create CREDIT ledger entry
     */

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount,
        transaction: transaction._id,
        type:"CREDIT"

    }], { session })

    /**
     * 8. Make transation (COMPLETED)
     */

    transaction.status = "COMPLETED"
    await transaction.save( { session })

    /**
     * 9. Commit MongoDB session
     */
    await session.commitTransaction()
    session.endSession()
}

catch(error) {
    await transactionModel.findOneAndUpdate(
        { idempotencyKey : idempotencyKey },
        { status:"FAILED" }
    )

    return res.status(400).json({
        message:"Transaction is PENDING due to some issue, please retry again sometime",
        error: error.message
    })
}


    /**
     * 10. SEND EMAIL NOTIFICATION
     */

    await emailService.sendTransactionEmail(
        req.user.email, req.user.name, amount, toAccount
    )

    return res.status(200).json({
        message:"Transaction completed successfully",
        transaction: transaction
    })

}

async function createInitalFundsTransaction (req,res) {

    const {toAccount, amount, idempotencyKey} = req.body;

    if(!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message:"toaccount , amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id:toAccount,
    })

    if(!toUserAccount) {
        return res.status(400).json({
            message:"Invalid Account"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if(!fromUserAccount) {
        return res.status(400).json({
            message:"System Account not found"
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()


    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"
    }, )


    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type:"DEBIT"
    }], { session })

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount,
        transaction: transaction._id,
        type:"CREDIT"
    }], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message:"Intial funds transaction completed successfully",
        transaction: transaction
    })
}



module.exports = {
    createTransaction,
    createInitalFundsTransaction,
    
};