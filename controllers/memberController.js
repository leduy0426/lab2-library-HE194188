const Member = require('../models/Member');

const getAllMembers = async (req, res) => {
    try {
        const members = await Member.find();
        res.status(200).json({
            success: true,
            count: members.length,
            data: members,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMemberById = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });
        }
        res.status(200).json({ success: true, data: member });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'ID thành viên không hợp lệ' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const createMember = async (req, res) => {
    try {
        const { fullName, email, phone, membershipType, isActive } = req.body;

        if (!fullName || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Các trường fullName, email và phone là bắt buộc',
            });
        }

        const allowedTypes = ['Student', 'Teacher', 'Guest'];
        if (membershipType && !allowedTypes.includes(membershipType)) {
            return res.status(400).json({
                success: false,
                message: `Loại thành viên phải là một trong: ${allowedTypes.join(', ')}`,
            });
        }

        const member = await Member.create({ fullName, email, phone, membershipType, isActive });
        res.status(201).json({ success: true, data: member });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Email đã tồn tại. Email phải là duy nhất.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateMember = async (req, res) => {
    try {
        const { membershipType } = req.body;

        const allowedTypes = ['Student', 'Teacher', 'Guest'];
        if (membershipType && !allowedTypes.includes(membershipType)) {
            return res.status(400).json({
                success: false,
                message: `Loại thành viên phải là một trong: ${allowedTypes.join(', ')}`,
            });
        }

        const member = await Member.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!member) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });
        }

        res.status(200).json({ success: true, data: member });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Email đã tồn tại. Email phải là duy nhất.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'ID thành viên không hợp lệ' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteMember = async (req, res) => {
    try {
        const member = await Member.findByIdAndDelete(req.params.id);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });
        }
        res.status(200).json({ success: true, message: 'Xóa thành viên thành công' });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'ID thành viên không hợp lệ' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllMembers, getMemberById, createMember, updateMember, deleteMember };
