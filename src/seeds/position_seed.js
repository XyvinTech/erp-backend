const Position = require('../modules/hrm/position/position.model');
const Department = require('../modules/hrm/department/department.model');
const mongoose = require('mongoose');

const seedPositions = async () => {
    try {
        console.log('Starting position seed...');

        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }

        // Check if positions already exist
        const existingPositions = await Position.countDocuments();
        if (existingPositions > 0) {
            console.log(`${existingPositions} positions already exist in the database`);
            return;
        }

        // Get departments to reference in positions
        const departments = await Department.find();
        if (departments.length === 0) {
            throw new Error('No departments found. Please run department seeds first.');
        }

        // Create a mapping of department names to department IDs for easier access
        const departmentMap = {};
        departments.forEach(dept => {
            departmentMap[dept.name] = dept._id;
        });

        // Sample position data
        const positionsData = [
            // Administration Department Positions
            {
                title: 'Chief Executive Officer',
                code: 'CEO',
                department: departmentMap['Administration'],
                description: 'Leads the organization and makes strategic decisions',
                responsibilities: [
                    'Develop and execute company strategy',
                    'Oversee all operations and business activities',
                    'Make high-level decisions about policy and strategy'
                ],
                requirements: [
                    'MBA or equivalent',
                    '10+ years of executive experience',
                    'Strong leadership and decision-making skills'
                ],
                employmentType: 'Full-time',
                level: 1,
                maxPositions: 1,
                isActive: true
            },
            {
                title: 'Chief Operating Officer',
                code: 'COO',
                department: departmentMap['Administration'],
                description: 'Oversees day-to-day administrative and operational functions',
                responsibilities: [
                    'Implement company strategy',
                    'Oversee daily operations',
                    'Optimize operational systems and processes'
                ],
                requirements: [
                    'MBA or equivalent',
                    '8+ years of operational management experience',
                    'Strong organizational and leadership skills'
                ],
                employmentType: 'Full-time',
                level: 2,
                maxPositions: 1,
                isActive: true
            },

            // Human Resources Department Positions
            {
                title: 'HR Manager',
                code: 'HRM',
                department: departmentMap['Human Resources'],
                description: 'Manages HR operations and personnel matters',
                responsibilities: [
                    'Oversee recruitment and hiring processes',
                    'Manage employee relations and benefits',
                    'Develop HR policies and procedures'
                ],
                requirements: [
                    'Bachelor\'s degree in HR or related field',
                    '5+ years of HR experience',
                    'Knowledge of labor laws and regulations'
                ],
                employmentType: 'Full-time',
                level: 3,
                maxPositions: 1,
                isActive: true
            },
            {
                title: 'Recruitment Specialist',
                code: 'RECSPEC',
                department: departmentMap['Human Resources'],
                description: 'Handles recruitment and selection of new employees',
                responsibilities: [
                    'Source and screen candidates',
                    'Conduct interviews and assessments',
                    'Coordinate with department managers on hiring needs'
                ],
                requirements: [
                    'Bachelor\'s degree in HR or related field',
                    '2+ years of recruitment experience',
                    'Strong communication and interpersonal skills'
                ],
                employmentType: 'Full-time',
                level: 4,
                maxPositions: 3,
                isActive: true
            },

            // IT Department Positions
            {
                title: 'IT Manager',
                code: 'ITM',
                department: departmentMap['Information Technology'],
                description: 'Manages IT infrastructure and technical resources',
                responsibilities: [
                    'Oversee IT operations and infrastructure',
                    'Manage IT staff and projects',
                    'Develop IT policies and procedures'
                ],
                requirements: [
                    'Bachelor\'s degree in Computer Science or related field',
                    '5+ years of IT management experience',
                    'Strong technical and leadership skills'
                ],
                employmentType: 'Full-time',
                level: 3,
                maxPositions: 1,
                isActive: true
            },
            {
                title: 'Software Engineer',
                code: 'SWE',
                department: departmentMap['Information Technology'],
                description: 'Develops and maintains software applications',
                responsibilities: [
                    'Design and develop software applications',
                    'Debug and fix software issues',
                    'Collaborate with cross-functional teams'
                ],
                requirements: [
                    'Bachelor\'s degree in Computer Science or related field',
                    '2+ years of software development experience',
                    'Proficiency in programming languages and frameworks'
                ],
                employmentType: 'Full-time',
                level: 4,
                maxPositions: 5,
                isActive: true
            },

            // Finance Department Positions
            {
                title: 'Finance Manager',
                code: 'FINM',
                department: departmentMap['Finance'],
                description: 'Oversees financial operations and reporting',
                responsibilities: [
                    'Manage financial planning and budgeting',
                    'Oversee accounting and financial reporting',
                    'Ensure compliance with financial regulations'
                ],
                requirements: [
                    'Bachelor\'s degree in Finance or Accounting',
                    'CPA or MBA preferred',
                    '5+ years of financial management experience'
                ],
                employmentType: 'Full-time',
                level: 3,
                maxPositions: 1,
                isActive: true
            },
            {
                title: 'Accountant',
                code: 'ACCT',
                department: departmentMap['Finance'],
                description: 'Handles accounting and financial reporting',
                responsibilities: [
                    'Maintain financial records',
                    'Prepare financial statements',
                    'Process accounts payable and receivable'
                ],
                requirements: [
                    'Bachelor\'s degree in Accounting',
                    '2+ years of accounting experience',
                    'Knowledge of accounting principles and software'
                ],
                employmentType: 'Full-time',
                level: 4,
                maxPositions: 3,
                isActive: true
            },

            // Sales Department Positions
            {
                title: 'Sales Manager',
                code: 'SALSM',
                department: departmentMap['Sales'],
                description: 'Manages sales operations and customer relationships',
                responsibilities: [
                    'Develop and implement sales strategies',
                    'Manage sales team and set targets',
                    'Build and maintain client relationships'
                ],
                requirements: [
                    'Bachelor\'s degree in Business or related field',
                    '5+ years of sales experience',
                    'Strong leadership and negotiation skills'
                ],
                employmentType: 'Full-time',
                level: 3,
                maxPositions: 1,
                isActive: true
            },
            {
                title: 'Sales Representative',
                code: 'SALSR',
                department: departmentMap['Sales'],
                description: 'Sells products and services to customers',
                responsibilities: [
                    'Identify and pursue sales opportunities',
                    'Meet or exceed sales targets',
                    'Maintain customer relationships'
                ],
                requirements: [
                    'Bachelor\'s degree preferred',
                    '1+ years of sales experience',
                    'Strong communication and persuasion skills'
                ],
                employmentType: 'Full-time',
                level: 4,
                maxPositions: 5,
                isActive: true
            },

            // Project Management Department Positions
            {
                title: 'Project Manager',
                code: 'PM',
                department: departmentMap['Project Management'],
                description: 'Oversees project planning, execution, and delivery',
                responsibilities: [
                    'Plan and execute projects',
                    'Manage project resources and timelines',
                    'Communicate with stakeholders'
                ],
                requirements: [
                    'Bachelor\'s degree in Business or related field',
                    'PMP certification preferred',
                    '3+ years of project management experience'
                ],
                employmentType: 'Full-time',
                level: 3,
                maxPositions: 3,
                isActive: true
            },
            {
                title: 'Business Analyst',
                code: 'BA',
                department: departmentMap['Project Management'],
                description: 'Analyzes business processes and requirements',
                responsibilities: [
                    'Gather and document business requirements',
                    'Analyze business processes and systems',
                    'Recommend process improvements'
                ],
                requirements: [
                    'Bachelor\'s degree in Business or related field',
                    '2+ years of business analysis experience',
                    'Strong analytical and problem-solving skills'
                ],
                employmentType: 'Full-time',
                level: 4,
                maxPositions: 4,
                isActive: true
            },

            // Quality Assurance Department Positions
            {
                title: 'QA Manager',
                code: 'QAM',
                department: departmentMap['Quality Assurance'],
                description: 'Manages quality assurance processes and standards',
                responsibilities: [
                    'Develop and implement QA methodologies',
                    'Manage QA team and testing processes',
                    'Ensure product quality and compliance'
                ],
                requirements: [
                    'Bachelor\'s degree in Computer Science or related field',
                    '5+ years of QA experience',
                    'Strong knowledge of testing methodologies'
                ],
                employmentType: 'Full-time',
                level: 3,
                maxPositions: 1,
                isActive: true
            },
            {
                title: 'Quality Assurance Specialist',
                code: 'QAS',
                department: departmentMap['Quality Assurance'],
                description: 'Tests and validates software quality',
                responsibilities: [
                    'Design and execute test cases',
                    'Identify and report software defects',
                    'Verify bug fixes and improvements'
                ],
                requirements: [
                    'Bachelor\'s degree in Computer Science or related field',
                    '2+ years of QA experience',
                    'Knowledge of testing tools and methodologies'
                ],
                employmentType: 'Full-time',
                level: 4,
                maxPositions: 4,
                isActive: true
            }
        ];

        console.log('Attempting to create positions...');

        // Insert all positions
        const createdPositions = await Position.create(positionsData);
        console.log(`Successfully created ${createdPositions.length} positions`);

        console.log('Position seed completed');
    } catch (error) {
        console.error('Error seeding positions:', error);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation error for ${key}:`, error.errors[key].message);
            });
        }
        throw error;
    }
};

module.exports = seedPositions; 