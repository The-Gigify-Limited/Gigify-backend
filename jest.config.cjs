module.exports = {
    roots: ['<rootDir>/build'],
    testEnvironment: 'node',
    testMatch: ['**/*.spec.js'],
    setupFiles: ['<rootDir>/jest.setup.cjs'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/build/$1',
        '^~/(.*)$': '<rootDir>/build/api/v1/$1',
    },
};
