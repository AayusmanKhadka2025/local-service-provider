const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const createInitialAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'local-services-db'
    });

    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin already exists');
      console.log('Username: admin');
      console.log('Password: Admin@123');
      process.exit(0);
    }

    const admin = await Admin.create({
      username: 'admin',
      email: 'admin@servease.com',
      password: 'Admin@123',
      fullName: 'Super Admin',
      role: 'super_admin'
    });

    console.log('✅ Admin created successfully!');
    console.log('📝 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: Admin@123');
    console.log('   Email: admin@servease.com');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createInitialAdmin();