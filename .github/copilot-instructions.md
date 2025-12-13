# Copilot / AI agent instructions for quanthex_backend

Summary
- Project type: NestJS (TypeScript) minimal starter app.
- Main things to know: `ConfigModule` is used globally for env config, and `TypeOrmModule.forRootAsync` is configured to read DB settings from env variables (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`).

Quick commands (from `package.json`)
- Install: `npm install`
- Start (dev): `npm run start:dev`
- Start (prod): `npm run start:prod` (after `npm run build` / `nest build`)
- Tests: `npm run test` (unit), `npm run test:e2e` (e2e), `npm run test:cov` (coverage)
- Debug tests: `npm run test:debug` (starts node inspector and registers ts-node/tsconfig-paths)

Architecture notes (what to read first)
- `src/app.module.ts` — central module. It imports `ConfigModule.forRoot({ isGlobal: true })` and `TypeOrmModule.forRootAsync(...)`. Review this file to understand bootstrapped modules and where DB entities must be registered.
- `src/main.ts` — bootstrap; listens on `process.env.PORT ?? 3000`.
- `src/app.controller.ts` and `src/app.service.ts` — minimal example of controller → service pattern used across the codebase.
- `test/app.e2e-spec.ts` — example of how e2e tests create a Nest testing module and assert routes via `supertest`.

Project-specific patterns and requirements
- Configuration: env values are accessed via `ConfigService.get<T>(KEY)`. For DB configuration the project expects env keys: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`.
- TypeORM: DB connection is created asynchronously using `forRootAsync` and `ConfigService`. Entities must be added to the `entities` array inside `TypeOrmModule.forRootAsync` in `src/app.module.ts` (currently empty).
- File structure: code lives under `src/` and compiled output goes to `dist/` as per `tsconfig.json` (`outDir: ./dist`). Tests expect `jest.rootDir` to be `src` (see `package.json` jest config).
- Testing: unit/e2e use `jest` + `ts-jest`. E2E shows the pattern: createTestingModule({ imports: [AppModule] }), then `createNestApplication()` and `app.init()`.

Where to add new code
- Add feature modules under `src/` (Nest convention). Typical files:
  - `src/<feature>/<feature>.module.ts`
  - `src/<feature>/<feature>.controller.ts`
  - `src/<feature>/<feature>.service.ts`
  - `src/entities/*.ts` for TypeORM entities (then reference them in `app.module.ts`'s `entities` array)

Examples and concrete edits that AI agents may be asked to perform
- Add an entity: create `src/entities/User.ts` and add its class to `entities` in `TypeOrmModule.forRootAsync`.
- Add a new module: wire it into `AppModule.imports` and export providers as needed.
- Update env usage: prefer `ConfigService.get<Type>("KEY")` instead of direct `process.env` in modules that already use `ConfigModule`.

Debugging and development notes
- Use `npm run start:dev` for hot-reload. The project uses Nest CLI; `nest build` compiles TypeScript to `dist/`.
- For test debugging the `test:debug` script sets up `--inspect-brk` and registers ts-node + tsconfig-paths.
- Lint/format: `npm run lint` and `npm run format`.

Integration points / external dependencies
- Database: `mysql2` + `@nestjs/typeorm`. Changes to DB schema require updating TypeORM entities and syncing/ migration logic (no migrations scaffolded in this repo).
- Config: `@nestjs/config` (global). Keep env keys consistent.

Conventions to preserve
- Use Nest idioms: modules, controllers, providers (services). Follow constructor injection (example: `constructor(private readonly appService: AppService) {}`).
- Keep `ConfigModule.forRoot({ isGlobal: true })` usage — do not replace with ad-hoc env reads unless necessary.
- Tests should instantiate `AppModule` via `Test.createTestingModule({ imports: [AppModule] })` when verifying end-to-end behavior.

Files to inspect when changing behavior
- `src/app.module.ts`, `src/main.ts`, any `src/*.module.ts` you add, `test/app.e2e-spec.ts`, and `package.json` scripts.

If unsure, ask (examples)
- Which folder should I place entities in? (default expectation: `src/entities`)
- Do you want TypeORM migrations configured or should I add `synchronize: true` for local development only?

End
Please review and tell me which sections to expand or any project-specific policies to include (migrations, CI, deployment secrets handling, etc.).
