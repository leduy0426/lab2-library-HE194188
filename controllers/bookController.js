const Book = require("../models/Book");

const getAllBooks = async (req, res) => {
    try {
        const books = await Book.find();
        res.status(200).json({
            success: true,
            count: books.length,
            data: books,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sách" });
        }
        res.status(200).json({ success: true, data: book });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ success: false, message: "ID sách không hợp lệ" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const createBook = async (req, res) => {
    try {
        const { title, author, category, isbn, publishedYear, totalCopies, availableCopies } = req.body;

        if (!title || !author || !category || !isbn) {
            return res.status(400).json({
                success: false,
                message: "Các trường title, author, category và isbn là bắt buộc",
            });
        }

        if (totalCopies !== undefined && totalCopies < 0) {
            return res.status(400).json({ success: false, message: "Tổng số bản sao không được âm" });
        }
        if (availableCopies !== undefined && availableCopies < 0) {
            return res.status(400).json({ success: false, message: "Số bản sao khả dụng không được âm" });
        }

        const book = await Book.create({ title, author, category, isbn, publishedYear, totalCopies, availableCopies });
        res.status(201).json({ success: true, data: book });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "ISBN đã tồn tại. ISBN phải là duy nhất." });
        }
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(", ") });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateBook = async (req, res) => {
    try {
        const { totalCopies, availableCopies } = req.body;

        if (totalCopies !== undefined && totalCopies < 0) {
            return res.status(400).json({ success: false, message: "Tổng số bản sao không được âm" });
        }
        if (availableCopies !== undefined && availableCopies < 0) {
            return res.status(400).json({ success: false, message: "Số bản sao khả dụng không được âm" });
        }

        const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!book) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sách" });
        }

        res.status(200).json({ success: true, data: book });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "ISBN đã tồn tại. ISBN phải là duy nhất." });
        }
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(", ") });
        }
        if (error.name === "CastError") {
            return res.status(400).json({ success: false, message: "ID sách không hợp lệ" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sách" });
        }
        res.status(200).json({ success: true, message: "Xóa sách thành công" });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ success: false, message: "ID sách không hợp lệ" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllBooks, getBookById, createBook, updateBook, deleteBook };
