const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const payload = {
      id: user._id,
      role: user.role,
      name: user.name
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'mysecretkey', { expiresIn: '1d' });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const profilePictureUrl = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: profilePictureUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture
        }
      }
    });

  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ success: false, message: 'Server error during profile picture update' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Allow any authenticated user to change their own password

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Server error during password change' });
  }
};

const forgotPasswordAdmin = async (req, res) => {
  try {
    const { email, secretKey, newPassword } = req.body;

    if (!email || !secretKey || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Admin account with this email not found' });
    }

    const expectedSecret = process.env.ADMIN_RESET_SECRET || 'admin123';
    if (secretKey !== expectedSecret) {
      return res.status(400).json({ success: false, message: 'Invalid admin verification key' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Admin password reset successfully' });
  } catch (error) {
    console.error('Error in forgotPasswordAdmin:', error);
    res.status(500).json({ success: false, message: 'Server error during admin password reset' });
  }
};

const updateSelf = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and Email are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Allow any authenticated user to update their own profile

    const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email is already taken by another account' });
    }

    user.name = name;
    user.email = email;
    await user.save();

    const userResponse = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture
    };

    res.json({ success: true, data: userResponse });
  } catch (error) {
    console.error('Error in updateSelf:', error);
    res.status(500).json({ success: false, message: 'Server error during profile update' });
  }
};

module.exports = {
  loginUser,
  updateProfilePicture,
  changePassword,
  forgotPasswordAdmin,
  updateSelf
};


