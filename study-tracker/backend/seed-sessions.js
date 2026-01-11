const db = require('./database');

/**
 * Seed Script: Add Study Sessions
 * This script adds sample study sessions to the database
 */

const studySessions = [
  {
    date: '2025-11-10',
    day: 'Monday',
    activity: 'Studied S3 Storage Types',
    topics_covered: 'S3 types - (standard, glacier)',
    time_spent: 120, // 2 hours in minutes
    notes: ''
  },
  {
    date: '2025-11-20',
    day: 'Thursday',
    activity: 'Studied AWS Compute and Storage Services',
    topics_covered: 'ASG, EC2, S3, EBS, EFS',
    time_spent: 120,
    notes: ''
  },
  {
    date: '2025-11-21',
    day: 'Friday',
    activity: 'Studied Database Services',
    topics_covered: 'RDS, Aurora, Multi-AZ, Read Replicas, IAM DB Authentication',
    time_spent: 150,
    notes: ''
  },
  {
    date: '2025-11-23',
    day: 'Sunday',
    activity: 'Studied VPC Fundamentals',
    topics_covered: 'AWS - ONE NOTE, vpc, subnet, natgatway, IGW',
    time_spent: 180,
    notes: ''
  },
  {
    date: '2025-11-26',
    day: 'Wednesday',
    activity: 'Studied VPC Advanced Concepts',
    topics_covered: 'Vpc-endpoint(gateway/interface), vpc peering, Transit Gateway, SG, Nacl',
    time_spent: 150,
    notes: 'Create a diagram for vpc architecture, SG source as a source'
  },
  {
    date: '2025-11-27',
    day: 'Thursday',
    activity: 'Studied Networking & Load Balancers',
    topics_covered: 'OSI Networking layers, ALB, NLB, API Gateway',
    time_spent: 180,
    notes: 'ALB vs NLB visualize diagram routing policies(latency, geography, weighted, failover), ALIAS(top-lvl-domain), CNAME(sub-lvl-domain)'
  },
  {
    date: '2025-11-28',
    day: 'Friday',
    activity: 'Studied Route 53 and CloudFront',
    topics_covered: 'Route 53(Policies), Cloudfront(OAC, Signed urls)',
    time_spent: 120,
    notes: ''
  },
  {
    date: '2025-12-03',
    day: 'Wednesday',
    activity: 'Studied Security Services',
    topics_covered: 'IAM, ROLES, Resource based policies, KMS, Secrets, MFA S3',
    time_spent: 150,
    notes: ''
  },
  {
    date: '2025-12-06',
    day: 'Saturday',
    activity: 'Studied Monitoring & Auditing',
    topics_covered: 'Monitoring & Auditing',
    time_spent: 180,
    notes: 'Udemy course questions(1-13), cloud watch group, strems, event, x-ray demon, x-ray traces, cloudtrail'
  },
  {
    date: '2025-12-07',
    day: 'Sunday',
    activity: 'Studied Database Services Deep Dive',
    topics_covered: 'DynamoDB, RDS, Elastic Cache, DAX, RCU, WCU',
    time_spent: 180,
    notes: 'Udemy course questions(5-13)(13-27)'
  }
];

async function seedStudySessions() {
  const client = await db.connect();
  
  try {
    console.log('🌱 Starting to seed study sessions...');

    // Get the first subject (or create one if none exists)
    let subject = await client.query('SELECT id FROM subjects LIMIT 1');
    
    if (subject.rows.length === 0) {
      console.log('📚 No subjects found. Creating "AWS Developer Associate" subject...');
      const newSubject = await client.query(
        `INSERT INTO subjects (name, description, icon, color) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['AWS Developer Associate', 'Preparing for AWS Certified Developer certification', '☁️', '#FF9900']
      );
      subject = newSubject;
    }

    const subjectId = subject.rows[0].id;
    console.log(`✅ Using subject ID: ${subjectId}`);

    // Insert all study sessions
    let insertedCount = 0;
    for (const session of studySessions) {
      await client.query(
        `INSERT INTO study_sessions (subject_id, date, day, activity, time_spent, topics_covered, notes, revision_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          subjectId,
          session.date,
          session.day,
          session.activity,
          session.time_spent,
          session.topics_covered,
          session.notes,
          0 // Start with 0 revisions
        ]
      );
      insertedCount++;
      console.log(`✅ Added session: ${session.date} - ${session.activity}`);
    }

    console.log(`\n🎉 Successfully seeded ${insertedCount} study sessions!`);
    console.log('📊 You can now view them in your Study Tracker app.');

  } catch (error) {
    console.error('❌ Error seeding study sessions:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

// Run the seed function
seedStudySessions();
