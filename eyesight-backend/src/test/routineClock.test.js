import test from 'node:test';
import assert from 'node:assert/strict';
import { weekKey, weekdayOf } from '../services/routineClock.js';

test('weekdayOf counts Monday as 1 in the configured time zone', () => {
  assert.equal(weekdayOf(new Date('2026-10-05T12:00:00Z')), 1);
  assert.equal(weekdayOf(new Date('2026-10-07T12:00:00Z')), 3);
  assert.equal(weekdayOf(new Date('2026-10-11T12:00:00Z')), 7);
});

test('the same instant can be Sunday in Brasília and Monday in UTC', () => {
  const instant = new Date('2026-10-05T02:00:00Z');
  assert.equal(weekdayOf(instant), 7);
  assert.equal(weekdayOf(instant, 'UTC'), 1);
});

test('weekKey is the ISO week of the local date', () => {
  assert.equal(weekKey(new Date('2026-10-05T12:00:00Z')), '2026-W41');
  assert.equal(weekKey(new Date('2026-10-11T23:00:00Z')), '2026-W41');
  assert.equal(weekKey(new Date('2026-10-05T02:00:00Z')), '2026-W40');
  assert.equal(weekKey(new Date('2026-10-05T02:00:00Z'), 'UTC'), '2026-W41');
});

test('weekKey follows ISO rules around the new year', () => {
  assert.equal(weekKey(new Date('2026-12-31T12:00:00Z')), '2026-W53');
  assert.equal(weekKey(new Date('2027-01-01T12:00:00Z')), '2026-W53');
  assert.equal(weekKey(new Date('2027-01-04T12:00:00Z')), '2027-W01');
});
