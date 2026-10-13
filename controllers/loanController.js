const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Member = require('../models/Member');
const Book = require('../models/Book');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const populateOptions = [
    {
        path: 'member_id',
        select: 'fullName email phone membershipType isActive',
    },
    {
        path: 'items.book_id',
        select: 'title author isbn category availableCopies',
    },
];

const getAllLoans = async (req, res) => {
    try {
        const loans = await Loan.find()
            .populate(populateOptions[0])
            .populate(populateOptions[1])
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: loans.length,
            data: loans,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getLoanById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'ID phiếu mượn không hợp lệ' });
        }

        const loan = await Loan.findById(id)
            .populate(populateOptions[0])
            .populate(populateOptions[1]);

        if (!loan) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu mượn' });
        }

        res.status(200).json({ success: true, data: loan });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getLoansByMember = async (req, res) => {
    try {
        const { memberId } = req.params;

        if (!isValidObjectId(memberId)) {
            return res.status(400).json({ success: false, message: 'ID thành viên không hợp lệ' });
        }

        const memberExists = await Member.findById(memberId);
        if (!memberExists) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });
        }

        const loans = await Loan.find({ member_id: memberId })
            .populate(populateOptions[0])
            .populate(populateOptions[1])
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            member: {
                _id: memberExists._id,
                fullName: memberExists.fullName,
                email: memberExists.email,
            },
            count: loans.length,
            data: loans,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createLoan = async (req, res) => {
    try {
        const { member_id, items, dueDate, borrowDate, returnDate, status } = req.body;

        if (!member_id) {
            return res.status(400).json({ success: false, message: 'Trường member_id là bắt buộc' });
        }
        if (!dueDate) {
            return res.status(400).json({ success: false, message: 'Trường dueDate là bắt buộc' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách sách mượn (items) phải là mảng và không được rỗng',
            });
        }

        if (!isValidObjectId(member_id)) {
            return res.status(400).json({ success: false, message: 'Định dạng member_id không hợp lệ' });
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (!item.book_id) {
                return res.status(400).json({
                    success: false,
                    message: `items[${i}].book_id là bắt buộc`,
                });
            }
            if (!isValidObjectId(item.book_id)) {
                return res.status(400).json({
                    success: false,
                    message: `items[${i}].book_id có định dạng ObjectId không hợp lệ`,
                });
            }
            if (item.quantity === undefined || item.quantity === null) {
                return res.status(400).json({
                    success: false,
                    message: `items[${i}].quantity là bắt buộc`,
                });
            }
            if (typeof item.quantity !== 'number' || item.quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: `items[${i}].quantity phải là số và >= 1`,
                });
            }
        }

        const member = await Member.findById(member_id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });
        }
        if (!member.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản thành viên đang bị khóa, không thể mượn sách',
            });
        }

        const bookIds = items.map((i) => i.book_id);
        const books = await Book.find({ _id: { $in: bookIds } });

        if (books.length !== bookIds.length) {
            const foundIds = books.map((b) => b._id.toString());
            const missing = bookIds.filter((id) => !foundIds.includes(id.toString()));
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy sách với ID: ${missing.join(', ')}`,
            });
        }

        const bookMap = {};
        books.forEach((b) => (bookMap[b._id.toString()] = b));

        for (const item of items) {
            const book = bookMap[item.book_id.toString()];
            if (book.availableCopies < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Sách "${book.title}" không đủ số lượng. Hiện còn: ${book.availableCopies}, Yêu cầu: ${item.quantity}`,
                });
            }
        }

        if (new Date(dueDate) <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Ngày trả (dueDate) phải là ngày trong tương lai',
            });
        }

        const allowedStatuses = ['Borrowing', 'Returned', 'Overdue'];
        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Trạng thái phải là một trong: ${allowedStatuses.join(', ')}`,
            });
        }

        const loan = await Loan.create({ member_id, items, dueDate, borrowDate, returnDate, status });

        for (const item of items) {
            await Book.findByIdAndUpdate(item.book_id, {
                $inc: { availableCopies: -item.quantity },
            });
        }

        const populatedLoan = await Loan.findById(loan._id)
            .populate(populateOptions[0])
            .populate(populateOptions[1]);

        res.status(201).json({ success: true, data: populatedLoan });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const returnLoan = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'ID phiếu mượn không hợp lệ' });
        }

        const loan = await Loan.findById(id);
        if (!loan) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu mượn' });
        }

        if (loan.status === 'Returned') {
            return res.status(400).json({
                success: false,
                message: 'Phiếu mượn này đã được trả trước đó, không thể trả lại lần nữa',
            });
        }

        loan.returnDate = new Date();
        loan.status = 'Returned';
        await loan.save();

        for (const item of loan.items) {
            await Book.findByIdAndUpdate(item.book_id, {
                $inc: { availableCopies: item.quantity },
            });
        }

        const populatedLoan = await Loan.findById(loan._id)
            .populate(populateOptions[0])
            .populate(populateOptions[1]);

        res.status(200).json({
            success: true,
            message: 'Trả sách thành công',
            data: populatedLoan,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllLoans, getLoanById, getLoansByMember, createLoan, returnLoan };
