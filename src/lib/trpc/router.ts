import type { Context } from '$lib/trpc/context';
import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import delay from 'delay';
import { v4 } from 'uuid';
import type { OpenApiMeta } from 'trpc-openapi';
import { patch } from 'jsondiffpatch';

import { Repository } from '$lib/utils/fs';

const programs = new Repository();

const library: any = {};

export const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const router = t.router({
	greeting: t.procedure.query(async () => {
		await delay(1500); // 👈 simulate an expensive operation
		return `Hello tRPC v10 @ ${new Date().toLocaleTimeString()}`;
	}),
	exception: t.procedure.query(async ({ ctx }) => {
		await delay(1500); // 👈 simulate an expensive operation
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'This is by design!',
			// optional: pass the original error to retain stack trace
			cause: ctx
		});
	}),
	/* Lifecycle of a program */
	'programs/new': t.procedure
		.meta({ openapi: { method: 'GET', path: '/programs/new' } })
		.output(z.string())
		.query(async () => {
			const t = v4();
			programs[t] = {};
			return t;
		}),
	'programs/ls': t.procedure
		.meta({ openapi: { method: 'GET', path: '/programs/ls' } })
		.output(z.array(z.object({ uid: z.string(), name: z.string(), tags: z.array(z.string()), desc: z.string() })))
		.query(async () => {
			return Object.keys(programs).map((x) => {
				return { uid: x, name: programs[x]?.name ?? x, tags: programs[x]?.tags ?? [], desc: programs[x]?.desc??'' };
			});
		}),

	'programs/delete': t.procedure
		.meta({ openapi: { method: 'DELETE', path: '/programs/delete/{uid}' } })
		.input(z.object({ uid: z.string() }))
		.query(async ({ input, ctx }) => {
			if (programs[input.uid] == undefined) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: `The program resource ${input.uid} cannot be found.`,
					cause: ctx
				});
			} else delete programs[input.uid];
		}),

	'programs/update': t.procedure
		.meta({ openapi: { method: 'POST', path: '/programs/update/{uid}' } })
		.input(
			z.object({
				uid: z.string(),
				data: z.any(),
				mode: z.enum(['replace', 'patch']).default('replace')
			})
		)
		.query(async ({ input, ctx }) => {
			if (programs[input.uid] == undefined) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: `The program resource ${input.uid} cannot be found.`,
					cause: ctx
				});
			} else {
				if (input.mode == 'patch') patch(programs[input.uid], input.data);
				else if (input.mode == 'replace') programs[input.uid] = input.data;
				return true;
			}
		}),
	'programs/get': t.procedure
		.meta({ openapi: { method: 'POST', path: '/programs/get/{uid}' } })
		.input(z.object({ uid: z.string()}))
		.query(async ({ input, ctx }) => {
			if (programs[input.uid] == undefined) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: `The program resource ${input.uid} cannot be found.`,
					cause: ctx
				});
			} else {
				return programs[input.uid];
			}
		}),
	/* Running cycle of a program */
	programRun: t.procedure
		.meta({ openapi: { method: 'GET', path: '/programs/start/{uid}' } })
		.input(z.object({ uid: z.string() }))
		.query(async () => {}),
	programAbort: t.procedure
		.meta({ openapi: { method: 'GET', path: '/programs/abort/{uid}' } })
		.input(z.object({ uid: z.string() }))
		.query(async () => {}),
	programAwait: t.procedure
		.meta({ openapi: { method: 'GET', path: '/programs/await/{uid}/{node}' } })
		.input(z.object({ uid: z.string(), node: z.string() }))
		.output(z.any())
		.query(async () => {
			return null;
		}),
	/* Handling of the library elements */
	/*
	'library/new': t.procedure
		.meta({ openapi: { method: 'GET', path: '/library/new' } })
		.output(z.string().nullable())
		.query(async () => {
			const t = v4();
			library[t] = {};
			return t;
		}),
	'library/ls': t.procedure
		.meta({ openapi: { method: 'GET', path: '/library/ls' } })
		.output(z.array(z.object({ uid: z.string(), name: z.string(), tags: z.array(z.string()) })))
		.query(async () => {
			return Object.keys(library).map((x) => {
				return { uid: x, name: library[x].name, tags: library[x].tags };
			});
		}),

	'library/delete': t.procedure
		.meta({ openapi: { method: 'DELETE', path: '/library/delete/{uid}' } })
		.input(z.object({ uid: z.string() }))
		.query(async ({ input }) => {
			if (programs[input.uid] == undefined) {
				throw 404;
			} else delete programs[input.uid];
		}),
	'library/update': t.procedure
		.meta({ openapi: { method: 'POST', path: '/library/update/{uid}' } })
		.input(z.object({ uid: z.string(), patch: z.any() }))
		.query(async ({ input }) => {
			if (library[input.uid] == undefined) {
				throw 404;
			} else {
				patch(library[input.uid], input.patch);
			}
		}),
	//Todo
	'library/get': t.procedure
		.meta({ openapi: { method: 'POST', path: '/library/get/{uid}' } })
		.input(z.object({ uid: z.string(), patch: z.any() }))
		.query(async ({ input }) => {
			if (library[input.uid] == undefined) {
				throw 404;
			} else {
				return library[input.uid];
			}
		})*/
});

export type Router = typeof router;
