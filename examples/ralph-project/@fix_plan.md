# Implementation Plan

## Task 1: Setup Project Structure

**Files:**
- Create: `package.json`
- Create: `src/index.js`
- Create: `src/todo.js`
- Create: `tests/todo.test.js`

**Steps:**
1. Initialize npm project
2. Install Express as dependency
3. Install testing framework (Jest or similar)
4. Create basic file structure
5. Commit initial structure

**Verification:**
- Run: `npm test`
- Expected: Tests run (may fail, that's ok for now)

---

## Task 2: Write Failing Test for GET /todos

**Files:**
- Modify: `tests/todo.test.js`

**Steps:**
1. Write failing test for GET /todos endpoint
2. Test should expect empty array initially
3. Run test to verify it fails (endpoint doesn't exist yet)
4. Commit failing test

**Verification:**
- Run: `npm test`
- Expected: Test fails with "route not found" or similar

---

## Task 3: Implement GET /todos Endpoint

**Files:**
- Modify: `src/index.js`
- Modify: `src/todo.js`

**Steps:**
1. Create Todo class/module with getTodos() method
2. Implement GET /todos route in Express
3. Return empty array initially
4. Run test to verify it passes
5. Commit working code

**Verification:**
- Run: `npm test`
- Expected: GET /todos test passes
- Run: `curl http://localhost:3000/todos`
- Expected: Returns `[]`

---

## Task 4: Write Failing Test for POST /todos

**Files:**
- Modify: `tests/todo.test.js`

**Steps:**
1. Write failing test for POST /todos
2. Test should create a new todo
3. Test should verify todo is returned with id
4. Run test to verify it fails
5. Commit failing test

**Verification:**
- Run: `npm test`
- Expected: POST /todos test fails

---

## Task 5: Implement POST /todos Endpoint

**Files:**
- Modify: `src/todo.js`
- Modify: `src/index.js`

**Steps:**
1. Implement createTodo() method
2. Add POST /todos route
3. Generate unique ID for new todos
4. Return created todo
5. Run test to verify it passes
6. Commit working code

**Verification:**
- Run: `npm test`
- Expected: POST /todos test passes
- Run: `curl -X POST http://localhost:3000/todos -H "Content-Type: application/json" -d '{"text":"Test todo"}'`
- Expected: Returns todo with id

---

## Task 6: Write Failing Test for GET /todos/:id

**Files:**
- Modify: `tests/todo.test.js`

**Steps:**
1. Write failing test for GET /todos/:id
2. Test should retrieve specific todo by id
3. Test should return 404 for non-existent id
4. Run test to verify it fails
5. Commit failing test

**Verification:**
- Run: `npm test`
- Expected: GET /todos/:id test fails

---

## Task 7: Implement GET /todos/:id Endpoint

**Files:**
- Modify: `src/todo.js`
- Modify: `src/index.js`

**Steps:**
1. Implement getTodoById() method
2. Add GET /todos/:id route
3. Return 404 if todo not found
4. Run test to verify it passes
5. Commit working code

**Verification:**
- Run: `npm test`
- Expected: GET /todos/:id test passes

---

## Task 8: Write Failing Test for PUT /todos/:id

**Files:**
- Modify: `tests/todo.test.js`

**Steps:**
1. Write failing test for PUT /todos/:id
2. Test should update existing todo
3. Test should return 404 for non-existent id
4. Run test to verify it fails
5. Commit failing test

**Verification:**
- Run: `npm test`
- Expected: PUT /todos/:id test fails

---

## Task 9: Implement PUT /todos/:id Endpoint

**Files:**
- Modify: `src/todo.js`
- Modify: `src/index.js`

**Steps:**
1. Implement updateTodo() method
2. Add PUT /todos/:id route
3. Return 404 if todo not found
4. Run test to verify it passes
5. Commit working code

**Verification:**
- Run: `npm test`
- Expected: PUT /todos/:id test passes

---

## Task 10: Write Failing Test for DELETE /todos/:id

**Files:**
- Modify: `tests/todo.test.js`

**Steps:**
1. Write failing test for DELETE /todos/:id
2. Test should delete existing todo
3. Test should return 404 for non-existent id
4. Run test to verify it fails
5. Commit failing test

**Verification:**
- Run: `npm test`
- Expected: DELETE /todos/:id test fails

---

## Task 11: Implement DELETE /todos/:id Endpoint

**Files:**
- Modify: `src/todo.js`
- Modify: `src/index.js`

**Steps:**
1. Implement deleteTodo() method
2. Add DELETE /todos/:id route
3. Return 404 if todo not found
4. Run test to verify it passes
5. Commit working code

**Verification:**
- Run: `npm test`
- Expected: DELETE /todos/:id test passes

---

## Task 12: Add Input Validation

**Files:**
- Modify: `src/todo.js`
- Modify: `tests/todo.test.js`

**Steps:**
1. Write failing test for invalid input (empty text, missing fields)
2. Implement validation for POST /todos
3. Implement validation for PUT /todos/:id
4. Return 400 for invalid input
5. Run tests to verify they pass
6. Commit validation code

**Verification:**
- Run: `npm test`
- Expected: All validation tests pass
- Run: `curl -X POST http://localhost:3000/todos -H "Content-Type: application/json" -d '{}'`
- Expected: Returns 400 error

---

## Task 13: Final Verification and Documentation

**Files:**
- Create: `README.md`

**Steps:**
1. Run all tests to ensure everything passes
2. Write README with API documentation
3. Document all endpoints
4. Add usage examples
5. Commit documentation

**Verification:**
- Run: `npm test`
- Expected: All tests pass
- Review: README.md is complete and accurate
