const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Jwtrz43BoMuk@ep-summer-sun-a8mm74nv-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
});

async function testQuery() {
  try {
    console.log('Testing database connection...');
    
    // Check if txcoming table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'txcoming'
      );
    `);
    console.log('Table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Count rows
      const countResult = await pool.query('SELECT COUNT(*) FROM txcoming');
      console.log('Total rows in txcoming:', countResult.rows[0].count);
      
      // Get sample data
      const sampleResult = await pool.query('SELECT * FROM txcoming LIMIT 5');
      console.log('Sample rows:', JSON.stringify(sampleResult.rows, null, 2));
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testQuery();
