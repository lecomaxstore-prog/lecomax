import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ADMIN_WORKSPACES, visibleAdminWorkspaces } from '../lib/admin-workspaces.ts';
import { adminApiPermission } from '../lib/admin-policy.ts';

test('workspace directory links point to existing pages and matches owner-only areas', () => {
  const tools = ADMIN_WORKSPACES.flatMap(group => group.tools);
  assert.equal(new Set(tools.map(tool => tool.href)).size, tools.length);
  for (const tool of tools) assert.ok(existsSync(`app${tool.href.split('?')[0]}/page.tsx`), tool.href);
  const ownerTools = visibleAdminWorkspaces(null).flatMap(group => group.tools);
  assert.equal(ownerTools.length, tools.length);
  assert.ok(ownerTools.some(tool => tool.href === '/admin/support'));
  assert.ok(ownerTools.some(tool => tool.href === '/admin/activity'));
  assert.equal(visibleAdminWorkspaces(undefined).length, 0);
  assert.equal(visibleAdminWorkspaces([]).length, 0);
});
test('staff only see permitted tools and creating a product requires view plus create access', () => {
  const tools = visibleAdminWorkspaces(['products.view', 'orders.view']).flatMap(group => group.tools);
  assert.deepEqual(tools.map(tool => tool.href).sort(), ['/admin/orders', '/admin/products']);
  assert.ok(!visibleAdminWorkspaces(['products.view', 'products.edit']).flatMap(group => group.tools).some(tool => tool.href.includes('new=1')));
  assert.ok(!visibleAdminWorkspaces(['products.create']).flatMap(group => group.tools).some(tool => tool.href.includes('new=1')));
  const create = visibleAdminWorkspaces(['products.view', 'products.create']).flatMap(group => group.tools).find(tool => tool.href.includes('new=1'))!;
  assert.ok(create);
  assert.ok(Array.isArray(create.permission) && create.permission.includes(adminApiPermission('/api/products', 'POST')!));
  assert.ok(visibleAdminWorkspaces(['messages.view', 'messages.reply']).flatMap(group => group.tools).every(tool => tool.permission !== null));
});
test('workspace search supports accents, descriptions and multiple words without leaking hidden tools', () => {
  assert.ok(visibleAdminWorkspaces(null, 'mediatheque').flatMap(group => group.tools).some(tool => tool.href === '/admin/media'));
  assert.ok(visibleAdminWorkspaces(['media.manage'], 'photos fichiers').flatMap(group => group.tools).some(tool => tool.href === '/admin/media'));
  assert.equal(visibleAdminWorkspaces(['orders.view'], 'equipe').length, 0);
  assert.equal(visibleAdminWorkspaces(null, 'no-such-tool').length, 0);
});
