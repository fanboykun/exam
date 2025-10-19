import { hash } from 'bcryptjs';
import { users, exams, questions, choises } from '../schema';
import { eq } from 'drizzle-orm';
import { db } from '..';

async function main() {
	// need improvement,

	try {
		if (process.env.NODE_ENV === 'production')
			throw new Error('This script is only for development environment');

		// Seed admin user
		const [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.email, 'admin@admin.com'))
			.limit(1);
		if (!existingUser) {
			const password = 'Admin123';
			if (!password) throw new Error('DEFAULT_PASSWORD is not set');
			const hashedPassword = await hash(password, 12);
			await db.insert(users).values({
				email: 'admin@admin.com',
				password: hashedPassword,
				name: 'Admin',
				userRole: 'admin',
				provider: 'password'
			});
		}

		// Seed exams
		await seedExam();
	} finally {
		console.log('seed done');
	}
}
main()
	.then(() => {
		console.log('Seeding completed');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Seeding failed', error);
		process.exit(1);
	});

async function seedExam() {
	const examData = [
		{
			id: crypto.randomUUID(),
			title: 'JavaScript Fundamentals',
			duration: 30,
			shouldRandomizeQuestions: true,
			description:
				'Test your knowledge of JavaScript basics including variables, functions, and control flow.',
			questions: [
				{
					number: 1,
					content: 'What is the correct way to declare a variable in JavaScript?',
					choices: [
						{ position: 1, content: 'var myVar = 5;', isCorrect: true },
						{ position: 2, content: 'variable myVar = 5;', isCorrect: false },
						{ position: 3, content: 'v myVar = 5;', isCorrect: false },
						{ position: 4, content: 'dim myVar = 5;', isCorrect: false }
					]
				},
				{
					number: 2,
					content: 'Which of the following is NOT a JavaScript data type?',
					choices: [
						{ position: 1, content: 'String', isCorrect: false },
						{ position: 2, content: 'Boolean', isCorrect: false },
						{ position: 3, content: 'Float', isCorrect: true },
						{ position: 4, content: 'Number', isCorrect: false }
					]
				},
				{
					number: 3,
					content: 'What does the "===" operator do in JavaScript?',
					choices: [
						{ position: 1, content: 'Assigns a value', isCorrect: false },
						{ position: 2, content: 'Compares value and type', isCorrect: true },
						{ position: 3, content: 'Compares only value', isCorrect: false },
						{ position: 4, content: 'Creates a new variable', isCorrect: false }
					]
				},
				{
					number: 4,
					content: 'How do you create a function in JavaScript?',
					choices: [
						{ position: 1, content: 'function myFunction()', isCorrect: true },
						{ position: 2, content: 'def myFunction()', isCorrect: false },
						{ position: 3, content: 'create myFunction()', isCorrect: false },
						{ position: 4, content: 'func myFunction()', isCorrect: false }
					]
				},
				{
					number: 5,
					content: 'What is the output of: typeof null?',
					choices: [
						{ position: 1, content: '"null"', isCorrect: false },
						{ position: 2, content: '"undefined"', isCorrect: false },
						{ position: 3, content: '"object"', isCorrect: true },
						{ position: 4, content: '"number"', isCorrect: false }
					]
				},
				{
					number: 6,
					content: 'Which method is used to add an element to the end of an array?',
					choices: [
						{ position: 1, content: 'push()', isCorrect: true },
						{ position: 2, content: 'pop()', isCorrect: false },
						{ position: 3, content: 'shift()', isCorrect: false },
						{ position: 4, content: 'unshift()', isCorrect: false }
					]
				},
				{
					number: 7,
					content: 'What is a closure in JavaScript?',
					choices: [
						{ position: 1, content: 'A function with access to its outer scope', isCorrect: true },
						{ position: 2, content: 'A way to close a program', isCorrect: false },
						{ position: 3, content: 'A type of loop', isCorrect: false },
						{ position: 4, content: 'A method to end execution', isCorrect: false }
					]
				},
				{
					number: 8,
					content: 'Which keyword is used to handle exceptions in JavaScript?',
					choices: [
						{ position: 1, content: 'try...catch', isCorrect: true },
						{ position: 2, content: 'throw...handle', isCorrect: false },
						{ position: 3, content: 'error...fix', isCorrect: false },
						{ position: 4, content: 'attempt...rescue', isCorrect: false }
					]
				},
				{
					number: 9,
					content: 'What does "NaN" stand for in JavaScript?',
					choices: [
						{ position: 1, content: 'Not a Number', isCorrect: true },
						{ position: 2, content: 'Null and Negative', isCorrect: false },
						{ position: 3, content: 'New Array Node', isCorrect: false },
						{ position: 4, content: 'None and Nothing', isCorrect: false }
					]
				},
				{
					number: 10,
					content: 'Which method converts a JSON string to a JavaScript object?',
					choices: [
						{ position: 1, content: 'JSON.parse()', isCorrect: true },
						{ position: 2, content: 'JSON.stringify()', isCorrect: false },
						{ position: 3, content: 'JSON.convert()', isCorrect: false },
						{ position: 4, content: 'JSON.toObject()', isCorrect: false }
					]
				}
			]
		},
		{
			id: crypto.randomUUID(),
			title: 'Python Programming Basics',
			duration: 45,
			shouldRandomizeQuestions: false,
			description:
				'Assess your understanding of Python syntax, data structures, and basic programming concepts.',
			questions: [
				{
					number: 1,
					content: 'Which of the following is the correct way to create a list in Python?',
					choices: [
						{ position: 1, content: 'list = [1, 2, 3]', isCorrect: true },
						{ position: 2, content: 'list = (1, 2, 3)', isCorrect: false },
						{ position: 3, content: 'list = {1, 2, 3}', isCorrect: false },
						{ position: 4, content: 'list = <1, 2, 3>', isCorrect: false }
					]
				},
				{
					number: 2,
					content: 'What is the output of: print(type([]))?',
					choices: [
						{ position: 1, content: '<class "list">', isCorrect: true },
						{ position: 2, content: '<class "array">', isCorrect: false },
						{ position: 3, content: '<class "tuple">', isCorrect: false },
						{ position: 4, content: '<class "dict">', isCorrect: false }
					]
				},
				{
					number: 3,
					content: 'Which keyword is used to define a function in Python?',
					choices: [
						{ position: 1, content: 'def', isCorrect: true },
						{ position: 2, content: 'function', isCorrect: false },
						{ position: 3, content: 'func', isCorrect: false },
						{ position: 4, content: 'define', isCorrect: false }
					]
				},
				{
					number: 4,
					content: 'What is the correct way to create a dictionary in Python?',
					choices: [
						{ position: 1, content: 'dict = {"key": "value"}', isCorrect: true },
						{ position: 2, content: 'dict = ["key": "value"]', isCorrect: false },
						{ position: 3, content: 'dict = ("key": "value")', isCorrect: false },
						{ position: 4, content: 'dict = <"key": "value">', isCorrect: false }
					]
				},
				{
					number: 5,
					content: 'Which method is used to add an item to the end of a list?',
					choices: [
						{ position: 1, content: 'append()', isCorrect: true },
						{ position: 2, content: 'add()', isCorrect: false },
						{ position: 3, content: 'insert()', isCorrect: false },
						{ position: 4, content: 'push()', isCorrect: false }
					]
				},
				{
					number: 6,
					content: 'What is the correct syntax for a for loop in Python?',
					choices: [
						{ position: 1, content: 'for i in range(10):', isCorrect: true },
						{ position: 2, content: 'for (i = 0; i < 10; i++)', isCorrect: false },
						{ position: 3, content: 'for i to 10:', isCorrect: false },
						{ position: 4, content: 'foreach i in 10:', isCorrect: false }
					]
				},
				{
					number: 7,
					content: 'Which operator is used for exponentiation in Python?',
					choices: [
						{ position: 1, content: '**', isCorrect: true },
						{ position: 2, content: '^', isCorrect: false },
						{ position: 3, content: 'exp()', isCorrect: false },
						{ position: 4, content: '^^', isCorrect: false }
					]
				},
				{
					number: 8,
					content: 'What does the "len()" function do?',
					choices: [
						{ position: 1, content: 'Returns the length of an object', isCorrect: true },
						{ position: 2, content: 'Creates a new list', isCorrect: false },
						{ position: 3, content: 'Converts to string', isCorrect: false },
						{ position: 4, content: 'Sorts a list', isCorrect: false }
					]
				},
				{
					number: 9,
					content: 'Which of the following is a mutable data type in Python?',
					choices: [
						{ position: 1, content: 'List', isCorrect: true },
						{ position: 2, content: 'Tuple', isCorrect: false },
						{ position: 3, content: 'String', isCorrect: false },
						{ position: 4, content: 'Integer', isCorrect: false }
					]
				},
				{
					number: 10,
					content: 'What is the correct way to import a module in Python?',
					choices: [
						{ position: 1, content: 'import module_name', isCorrect: true },
						{ position: 2, content: 'include module_name', isCorrect: false },
						{ position: 3, content: 'require module_name', isCorrect: false },
						{ position: 4, content: 'using module_name', isCorrect: false }
					]
				}
			]
		},
		{
			id: crypto.randomUUID(),
			title: 'Web Development Essentials',
			duration: 60,
			shouldRandomizeQuestions: true,
			description: 'Comprehensive test covering HTML, CSS, and basic web development concepts.',
			questions: [
				{
					number: 1,
					content: 'What does HTML stand for?',
					choices: [
						{ position: 1, content: 'HyperText Markup Language', isCorrect: true },
						{ position: 2, content: 'High Tech Modern Language', isCorrect: false },
						{ position: 3, content: 'Home Tool Markup Language', isCorrect: false },
						{ position: 4, content: 'Hyperlinks and Text Markup Language', isCorrect: false }
					]
				},
				{
					number: 2,
					content: 'Which CSS property is used to change text color?',
					choices: [
						{ position: 1, content: 'color', isCorrect: true },
						{ position: 2, content: 'text-color', isCorrect: false },
						{ position: 3, content: 'font-color', isCorrect: false },
						{ position: 4, content: 'text-style', isCorrect: false }
					]
				},
				{
					number: 3,
					content: 'What is the correct HTML tag for the largest heading?',
					choices: [
						{ position: 1, content: '<h1>', isCorrect: true },
						{ position: 2, content: '<heading>', isCorrect: false },
						{ position: 3, content: '<h6>', isCorrect: false },
						{ position: 4, content: '<head>', isCorrect: false }
					]
				},
				{
					number: 4,
					content: 'Which property is used to change the background color in CSS?',
					choices: [
						{ position: 1, content: 'background-color', isCorrect: true },
						{ position: 2, content: 'bgcolor', isCorrect: false },
						{ position: 3, content: 'color-background', isCorrect: false },
						{ position: 4, content: 'bg-color', isCorrect: false }
					]
				},
				{
					number: 5,
					content: 'What is the correct HTML for creating a hyperlink?',
					choices: [
						{ position: 1, content: '<a href="url">Link</a>', isCorrect: true },
						{ position: 2, content: '<link>url</link>', isCorrect: false },
						{ position: 3, content: '<hyperlink>url</hyperlink>', isCorrect: false },
						{ position: 4, content: '<url>Link</url>', isCorrect: false }
					]
				},
				{
					number: 6,
					content: 'Which CSS property controls the text size?',
					choices: [
						{ position: 1, content: 'font-size', isCorrect: true },
						{ position: 2, content: 'text-size', isCorrect: false },
						{ position: 3, content: 'text-style', isCorrect: false },
						{ position: 4, content: 'size', isCorrect: false }
					]
				},
				{
					number: 7,
					content: 'What is the correct HTML for inserting an image?',
					choices: [
						{ position: 1, content: '<img src="image.jpg" alt="description">', isCorrect: true },
						{ position: 2, content: '<image src="image.jpg">', isCorrect: false },
						{ position: 3, content: '<picture>image.jpg</picture>', isCorrect: false },
						{ position: 4, content: '<img>image.jpg</img>', isCorrect: false }
					]
				},
				{
					number: 8,
					content: 'Which HTML attribute specifies an alternate text for an image?',
					choices: [
						{ position: 1, content: 'alt', isCorrect: true },
						{ position: 2, content: 'title', isCorrect: false },
						{ position: 3, content: 'text', isCorrect: false },
						{ position: 4, content: 'description', isCorrect: false }
					]
				},
				{
					number: 9,
					content: 'What does CSS stand for?',
					choices: [
						{ position: 1, content: 'Cascading Style Sheets', isCorrect: true },
						{ position: 2, content: 'Computer Style Sheets', isCorrect: false },
						{ position: 3, content: 'Creative Style Sheets', isCorrect: false },
						{ position: 4, content: 'Colorful Style Sheets', isCorrect: false }
					]
				},
				{
					number: 10,
					content: 'Which HTML tag is used to define an internal style sheet?',
					choices: [
						{ position: 1, content: '<style>', isCorrect: true },
						{ position: 2, content: '<css>', isCorrect: false },
						{ position: 3, content: '<script>', isCorrect: false },
						{ position: 4, content: '<styles>', isCorrect: false }
					]
				}
			]
		}
	];

	for (const exam of examData) {
		// Check if exam already exists
		const [existingExam] = await db
			.select()
			.from(exams)
			.where(eq(exams.title, exam.title))
			.limit(1);

		if (existingExam) {
			console.log(`Exam "${exam.title}" already exists, skipping...`);
			continue;
		}

		// Insert exam
		await db.insert(exams).values({
			id: exam.id,
			title: exam.title,
			duration: exam.duration,
			shouldRandomizeQuestions: exam.shouldRandomizeQuestions,
			description: exam.description
		});

		console.log(`Created exam: ${exam.title}`);

		// Insert questions and choices
		for (const question of exam.questions) {
			const questionId = crypto.randomUUID();

			await db.insert(questions).values({
				id: questionId,
				examId: exam.id,
				number: question.number,
				content: question.content
			});

			// Insert choices for this question
			for (const choice of question.choices) {
				await db.insert(choises).values({
					questionId: questionId,
					position: choice.position,
					content: choice.content,
					isCorrect: choice.isCorrect
				});
			}
		}

		console.log(`  Added ${exam.questions.length} questions with choices`);
	}

	console.log('Exam seeding completed!');
}
