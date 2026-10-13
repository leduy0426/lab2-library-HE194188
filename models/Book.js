const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        author: {
            type: String,
            required: [true, 'Author is required'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
        },
        isbn: {
            type: String,
            required: [true, 'ISBN is required'],
            unique: true,
            trim: true,
        },
        publishedYear: {
            type: Number,
        },
        totalCopies: {
            type: Number,
            min: [0, 'Total copies cannot be negative'],
            default: 0,
        },
        availableCopies: {
            type: Number,
            min: [0, 'Available copies cannot be negative'],
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);
