import { pgTable, serial, text, integer, boolean, timestamp, bigint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const captures = pgTable('captures', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' }),
  photo: text('photo').notNull(), // Base64 data URL
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  itemType: text('item_type').notNull(),
  temperature: integer('temperature').notNull(),
  isOfficial: boolean('is_official').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  captures: many(captures),
}));

export const capturesRelations = relations(captures, ({ one }) => ({
  user: one(users, {
    fields: [captures.userId],
    references: [users.id],
  }),
}));
