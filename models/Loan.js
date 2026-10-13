const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
    {
        member_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member',
            required: [true, 'Member ID is required'],
        },
        items: [
            {
                book_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Book',
                    required: [true, 'Book ID is required'],
                },
                quantity: {
                    type: Number,
                    min: [1, 'Quantity must be at least 1'],
                    required: [true, 'Quantity is required'],
                },
            },
        ],
        borrowDate: {
            type: Date,
            default: Date.now,
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required'],
        },
        returnDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: {
                values: ['Borrowing', 'Returned', 'Overdue'],
                message: 'Status must be one of: Borrowing, Returned, Overdue',
            },
            default: 'Borrowing',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Loan', loanSchema);
