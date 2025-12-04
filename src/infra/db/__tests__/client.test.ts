import { sql } from 'drizzle-orm'
import type { AppConfig } from '../../../config/config'
import { createDb } from '../client'

/**
 * Simple connectivity test for database client
 * Tests that we can create a client and execute a basic query
 */
async function testDbConnection() {
	// Mock config with database URL from environment
	const dbUrl = process.env.DB_URL || process.env.DATABASE_URL
	const config: AppConfig = {
		database: {
			url: dbUrl,
		},
		openai: {
			apiKey: undefined,
		},
		environment: 'development',
		isDevelopment: true,
		isProduction: false,
	}

	if (!config.database.url) {
		console.log('⚠️  DB_URL or DATABASE_URL not set, skipping connection test')
		return
	}

	try {
		// Create database client
		const db = createDb(config)

		// Execute simple SELECT 1 query to verify connectivity
		const result = await db.execute(sql`SELECT 1 as result`)

		console.log('✅ Database connection successful!')
		console.log('Query result:', result)
	} catch (error) {
		console.error('❌ Database connection failed:', error)
		throw error
	}
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	testDbConnection()
		.then(() => {
			console.log('Test completed successfully')
			process.exit(0)
		})
		.catch((error) => {
			console.error('Test failed:', error)
			process.exit(1)
		})
}

export { testDbConnection }
