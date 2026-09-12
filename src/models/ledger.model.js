const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"account",
        requried:[true, "Ledger must be associated with an account"],
        index:true,
        immutable:true
    },
    amount: {
        type:Number,
        required:[true, "Amount is requried for creating a ledger entry"],
        immutable:true
    },
    transaction:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"transaction",
        required:[true, "Ledger must be associated with an account"],
        immutable:true,
        index:true
    },
    type:{
        type:String,
        enum: {
            values:["CREDIT", "DEBIT"],
            message:"Types can be either Credit or Debit",
        },
        required:[true, "Ledger type is required"],
        immutable:true
    }
})

function preventLedgerModification() {
    throw new Error("Ledger entries are immutable and cannot be modified or delted");
}

ledgerSchema.pre("findOneandUpdate", preventLedgerModification);
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("remove", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification)


const ledgerModel = mongoose.model("ledger", ledgerSchema);

module.exports = ledgerModel;