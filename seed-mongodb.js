const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('./config/mongodb');
const User = require('./models/User');
const Maid = require('./models/Maid');
const Job = require('./models/Job');
const Review = require('./models/Review');
const Notification = require('./models/Notification');

async function seedDatabase() {
  try {
    console.log('🌱 Seeding MongoDB database...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Maid.deleteMany({});
    await Job.deleteMany({});
    await Notification.deleteMany({});
    await Review.deleteMany({});
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@hmts.com',
      password_hash: adminPasswordHash,
      role: 'admin',
      verification_status: 'verified'
    });
    await admin.save();
    console.log('✅ Admin: admin@hmts.com / admin123');
    
    // Create homeowner
    console.log('🏠 Creating homeowner...');
    const homeownerPasswordHash = await bcrypt.hash('homeowner123', 10);
    const homeowner = new User({
      name: 'John Doe',
      email: 'homeowner@test.com',
      phone: '1234567890',
      password_hash: homeownerPasswordHash,
      role: 'homeowner',
      verification_status: 'verified'
    });
    await homeowner.save();
    console.log('✅ Homeowner: homeowner@test.com / homeowner123');

    
    // Create multiple maids
    console.log('🧹 Creating sample maids...');
    const maidsData = [
      { name: 'Maria Garcia', email: 'maria@test.com', specializations: 'General Cleaning', hourly_rate: 15, experience_years: 5, rating: 4.8, reviews: 127, location: 'Sector 1', is_online: true, is_verified: true, bio: 'Professional cleaner with 5 years experience. Specialized in residential cleaning.', status: 'approved' },
      { name: 'Sarah Johnson', email: 'sarah@test.com', specializations: 'Deep Cleaning', hourly_rate: 18, experience_years: 4, rating: 4.9, reviews: 98, location: 'Sector 2', is_online: true, is_verified: true, bio: 'Expert in deep cleaning and sanitization. Eco-friendly products used.', status: 'approved' },
      { name: 'Lisa Brown', email: 'lisa@test.com', specializations: 'Kitchen Specialist', hourly_rate: 16, experience_years: 3, rating: 4.2, reviews: 64, location: 'Sector 1', is_online: false, is_verified: true, bio: 'Kitchen cleaning specialist. Restaurant-grade cleaning standards.', status: 'approved' },
      { name: 'Emma Wilson', email: 'emma@test.com', specializations: 'Laundry Specialist', hourly_rate: 14, experience_years: 2, rating: 4.5, reviews: 45, location: 'Sector 3', is_online: true, is_verified: true, bio: 'Laundry and ironing expert. Delicate fabric handling.', status: 'approved' },
      { name: 'Ana Martinez', email: 'ana@test.com', specializations: 'General Cleaning', hourly_rate: 15, experience_years: 6, rating: 4.7, reviews: 156, location: 'Sector 2', is_online: true, is_verified: true, bio: 'Reliable and thorough. Available for regular weekly cleaning.', status: 'approved' },
      // Pending maids for admin approval testing
      { name: 'Jennifer Lopez', email: 'jennifer@test.com', specializations: 'General Cleaning', hourly_rate: 14, experience_years: 1, rating: 0, reviews: 0, location: 'Sector 1', is_online: false, is_verified: false, bio: 'New to professional cleaning. Eager to learn and work hard.', status: 'pending' },
      { name: 'Rosa Sanchez', email: 'rosa@test.com', specializations: 'Deep Cleaning', hourly_rate: 16, experience_years: 3, rating: 0, reviews: 0, location: 'Sector 3', is_online: false, is_verified: false, bio: 'Experienced cleaner looking for new opportunities.', status: 'pending' }
    ];
    
    const maidPasswordHash = await bcrypt.hash('maid123', 10);
    const createdMaids = [];
    
    for (const maidData of maidsData) {
      const maidUser = new User({
        name: maidData.name,
        email: maidData.email,
        phone: '555' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0'),
        password_hash: maidPasswordHash,
        role: 'maid',
        verification_status: 'verified'
      });
      await maidUser.save();
      
      const maidProfile = new Maid({
        user_id: maidUser._id,
        approval_status: maidData.status || 'approved',
        specializations: maidData.specializations,
        experience_years: maidData.experience_years,
        hourly_rate: maidData.hourly_rate,
        average_rating: maidData.rating,
        total_reviews: maidData.reviews,
        location: maidData.location,
        is_online: maidData.is_online,
        is_verified: maidData.is_verified,
        bio: maidData.bio
      });
      await maidProfile.save();
      if (maidData.status === 'approved') {
        createdMaids.push({ user: maidUser, profile: maidProfile, data: maidData });
      }
    }
    const approvedCount = maidsData.filter(m => m.status === 'approved').length;
    const pendingCount = maidsData.filter(m => m.status === 'pending').length;
    console.log(`✅ Created ${approvedCount} approved maids + ${pendingCount} pending maids (password: maid123)`);
    
    // Create sample jobs for homeowner
    console.log('📋 Creating sample jobs...');
    const today = new Date();
    const jobs = [
      // Jobs for Maria (maid@test.com) - first maid
      { maid: createdMaids[0], title: 'General House Cleaning', status: 'in_progress', daysOffset: 0, hour: 10 },
      { maid: createdMaids[0], title: 'Weekly Cleaning', status: 'completed', daysOffset: -6, hour: 10 },
      { maid: createdMaids[0], title: 'Bathroom Deep Clean', status: 'completed', daysOffset: -10, hour: 9 },
      { maid: createdMaids[0], title: 'Kitchen Cleaning', status: 'requested', daysOffset: 1, hour: 11 },
      { maid: createdMaids[0], title: 'Full House Cleaning', status: 'requested', daysOffset: 2, hour: 9 },
      { maid: createdMaids[0], title: 'Living Room Cleaning', status: 'accepted', daysOffset: 0, hour: 15 },
      // Jobs for Sarah (second maid)
      { maid: createdMaids[1], title: 'Deep Cleaning', status: 'accepted', daysOffset: 0, hour: 14 },
      { maid: createdMaids[1], title: 'Move-out Cleaning', status: 'completed', daysOffset: -13, hour: 9 },
      { maid: createdMaids[1], title: 'Spring Cleaning', status: 'requested', daysOffset: 3, hour: 10 }
    ];
    
    for (const jobData of jobs) {
      const scheduledDate = new Date(today);
      scheduledDate.setDate(scheduledDate.getDate() + jobData.daysOffset);
      scheduledDate.setHours(jobData.hour, 0, 0, 0);
      
      const job = new Job({
        homeowner_id: homeowner._id,
        maid_id: jobData.maid.profile._id,
        title: jobData.title,
        description: `${jobData.title} service`,
        address: 'Sector 1, Building A, Apt 301',
        scheduled_datetime: scheduledDate,
        status: jobData.status,
        hourly_rate: jobData.maid.data.hourly_rate,
        estimated_duration: 4,
        actual_duration: jobData.status === 'completed' ? 4 : null
      });
      await job.save();
      
      // Add review for completed jobs
      if (jobData.status === 'completed') {
        const review = new Review({
          job_id: job._id,
          reviewer_id: homeowner._id,
          reviewee_id: jobData.maid.user._id,
          rating: 5,
          comments: 'Excellent work! Very thorough and professional.'
        });
        await review.save();
      }
    }
    console.log(`✅ Created ${jobs.length} sample jobs`);
    
    // Create sample notifications
    console.log('🔔 Creating sample notifications...');
    const notifications = [
      // For maid (Maria)
      { user_id: createdMaids[0].user._id, type: 'job_request', title: 'New Job Request', message: 'John Doe has requested your service for "Kitchen Cleaning"', is_read: false },
      { user_id: createdMaids[0].user._id, type: 'job_request', title: 'New Job Request', message: 'John Doe has requested your service for "Full House Cleaning"', is_read: false },
      { user_id: createdMaids[0].user._id, type: 'new_review', title: 'New Review Received', message: 'John Doe left a 5-star review for "Weekly Cleaning"', is_read: true },
      { user_id: createdMaids[0].user._id, type: 'payment_received', title: 'Payment Received', message: 'You received $60.00 for "Weekly Cleaning"', is_read: true },
      // For homeowner
      { user_id: homeowner._id, type: 'job_started', title: 'Maid Has Arrived', message: 'Maria Garcia has checked in and started working on "General House Cleaning"', is_read: false },
      { user_id: homeowner._id, type: 'job_accepted', title: 'Job Accepted', message: 'Maria Garcia has accepted your booking for "Living Room Cleaning"', is_read: true },
      { user_id: homeowner._id, type: 'job_completed', title: 'Job Completed', message: 'Maria Garcia has completed "Weekly Cleaning". Please leave a review!', is_read: true }
    ];
    
    for (const notif of notifications) {
      await Notification.create(notif);
    }
    console.log(`✅ Created ${notifications.length} sample notifications`);
    
    console.log('🎉 Database seeding completed!');
    console.log(`📊 Users: ${await User.countDocuments()}`);
    console.log(`📊 Maids: ${await Maid.countDocuments()}`);
    console.log(`📊 Jobs: ${await Job.countDocuments()}`);
    console.log(`📊 Reviews: ${await Review.countDocuments()}`);
    console.log(`📊 Notifications: ${await Notification.countDocuments()}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
