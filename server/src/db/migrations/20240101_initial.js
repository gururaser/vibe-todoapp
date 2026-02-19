/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    // Enable uuid extension
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // ─── Users ──────────────────────────────────────────────────────────────────
    await knex.schema.createTable('users', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.string('email', 255).unique().notNullable();
        t.string('password', 255).notNullable();
        t.string('name', 100).notNullable();
        t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    });

    // ─── Categories ─────────────────────────────────────────────────────────────
    await knex.schema.createTable('categories', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        t.string('name', 100).notNullable();
        t.string('color', 7).notNullable().defaultTo('#6C63FF');
    });

    // ─── Todos ──────────────────────────────────────────────────────────────────
    await knex.schema.createTable('todos', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        t.uuid('category_id').nullable().references('id').inTable('categories').onDelete('SET NULL');
        t.string('title', 255).notNullable();
        t.text('description').nullable();
        t.enu('priority', ['low', 'medium', 'high']).nullable();
        t.timestamp('due_date', { useTz: true }).nullable();
        t.boolean('completed').defaultTo(false);
        t.integer('order_index').notNullable().defaultTo(0);
        t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
        t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    });

    // ─── Tags ───────────────────────────────────────────────────────────────────
    await knex.schema.createTable('tags', (t) => {
        t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        t.string('name', 50).notNullable();
        t.unique(['user_id', 'name']); // prevent duplicate tag names per user
    });

    // ─── Todo-Tags (join table) ──────────────────────────────────────────────────
    await knex.schema.createTable('todo_tags', (t) => {
        t.uuid('todo_id').notNullable().references('id').inTable('todos').onDelete('CASCADE');
        t.uuid('tag_id').notNullable().references('id').inTable('tags').onDelete('CASCADE');
        t.primary(['todo_id', 'tag_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('todo_tags');
    await knex.schema.dropTableIfExists('tags');
    await knex.schema.dropTableIfExists('todos');
    await knex.schema.dropTableIfExists('categories');
    await knex.schema.dropTableIfExists('users');
};
