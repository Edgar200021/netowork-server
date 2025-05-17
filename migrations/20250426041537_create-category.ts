import { type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("category")
		.addColumn("id", "integer", (col) =>
			col.primaryKey().generatedAlwaysAsIdentity(),
		)
		.addColumn("created_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("updated_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("name", "text", (col) => col.notNull().unique())
		.addColumn("parent_id", "integer", (col) =>
			col.references("category.id").onDelete("cascade").onUpdate("cascade"),
		)
		.execute();

	await db
		.insertInto("category")
		.values([
			{
				name: "программирование и разработка",
			},

			{
				name: "дизайн и графика",
			},
			{
				name: "маркетинг и реклама",
			},
			{
				name: "контент и переводы",
			},
			{
				name: "видео и аудио",
			},
			{
				name: "бизнес и администрирование",
			},
			{
				name: "образование и обучение",
			},
			{
				name: "креативные услуги",
			},
			{
				name: "инженерия и архитектура",
			},
		])
		.execute();

	const categories = await db
		.selectFrom("category")
		.select(["id", "name"])
		.execute();

	const findCategoryId = (name: string) => {
		const category = categories.find((cat) => cat.name === name);
		if (!category) {
			throw new Error(`Category "${name}" not found`);
		}
		return category.id;
	};

	const programmingId = findCategoryId("программирование и разработка");
	const designId = findCategoryId("дизайн и графика");
	const marketingId = findCategoryId("маркетинг и реклама");
	const contentId = findCategoryId("контент и переводы");
	const videoId = findCategoryId("видео и аудио");
	const businessId = findCategoryId("бизнес и администрирование");
	const educationId = findCategoryId("образование и обучение");
	const creativeId = findCategoryId("креативные услуги");
	const engineeringId = findCategoryId("инженерия и архитектура");

	await db
		.insertInto("category")
		.values([
			{
				name: "веб-разработка",
				parent_id: programmingId,
			},
			{
				name: "мобильная разработка",
				parent_id: programmingId,
			},
			{
				name: "разработка игр",
				parent_id: programmingId,
			},
			{
				name: "разработка программного обеспечения",
				parent_id: programmingId,
			},
			{
				name: "DevOps и облачные технологии",
				parent_id: programmingId,
			},
			{
				name: "блокчейн и криптовалюты",
				parent_id: programmingId,
			},
			{
				name: "базы данных и аналитика",
				parent_id: programmingId,
			},
			{ name: "UI/UX-дизайн", parent_id: designId },
			{
				name: "графический дизайн",
				parent_id: designId,
			},
			{
				name: "моушн-дизайн и анимация",
				parent_id: designId,
			},
			{
				name: "3D-моделирование и визуализация",
				parent_id: designId,
			},
			{ name: "дизайн для печати", parent_id: designId },
			{
				name: "дизайн для социальных сетей",
				parent_id: designId,
			},
			{ name: "SEO и SEM", parent_id: marketingId },
			{ name: "SMM", parent_id: marketingId },
			{
				name: "контент-маркетинг",
				parent_id: marketingId,
			},
			{ name: "PPC-реклама", parent_id: marketingId },
			{
				name: "аналитика и стратегия",
				parent_id: marketingId,
			},
			{
				name: "PR и управление репутацией",
				parent_id: marketingId,
			},
			{
				name: "копирайтинг и редактура",
				parent_id: contentId,
			},
			{ name: "переводы", parent_id: contentId },
			{
				name: "транскрибация и субтитры",
				parent_id: contentId,
			},
			{
				name: "написание технической документации",
				parent_id: contentId,
			},
			{
				name: "создание презентаций",
				parent_id: contentId,
			},
			{
				name: "видеопроизводство",
				parent_id: videoId,
			},
			{
				name: "анимация и моушн-графика",
				parent_id: videoId,
			},
			{
				name: "аудиопроизводство",
				parent_id: videoId,
			},
			{
				name: "озвучивание и дубляж",
				parent_id: videoId,
			},
			{
				name: "музыкальное производство",
				parent_id: videoId,
			},
			{
				name: "управление проектами",
				parent_id: businessId,
			},
			{
				name: "виртуальная помощь",
				parent_id: businessId,
			},
			{
				name: "обработка данных",
				parent_id: businessId,
			},
			{
				name: "финансовые услуги",
				parent_id: businessId,
			},
			{
				name: "юридические консультации",
				parent_id: businessId,
			},
			{ name: "HR и рекрутинг", parent_id: businessId },
			{
				name: "онлайн-репетиторство",
				parent_id: educationId,
			},
			{
				name: "создание курсов",
				parent_id: educationId,
			},
			{
				name: "коучинг и наставничество",
				parent_id: educationId,
			},
			{
				name: "академическое письмо",
				parent_id: educationId,
			},
			{
				name: "иллюстрации и комиксы",
				parent_id: creativeId,
			},
			{
				name: "фотография и ретушь",
				parent_id: creativeId,
			},
			{ name: "мода и стиль", parent_id: creativeId },
			{
				name: "ремесла и хендмейд",
				parent_id: creativeId,
			},
			{ name: "CAD и чертежи", parent_id: engineeringId },
			{
				name: "архитектурный дизайн",
				parent_id: engineeringId,
			},
			{
				name: "электроника и схемотехника",
				parent_id: engineeringId,
			},
			{
				name: "механическая инженерия",
				parent_id: engineeringId,
			},
		])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("category").execute();
}
