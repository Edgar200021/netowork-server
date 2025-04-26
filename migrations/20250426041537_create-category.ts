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
		.addColumn("name", "text", (col) => col.notNull())
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
				name: "Веб-разработка",
				parent_id: programmingId,
			},
			{
				name: "Мобильная разработка",
				parent_id: programmingId,
			},
			{
				name: "Разработка игр",
				parent_id: programmingId,
			},
			{
				name: "Разработка программного обеспечения",
				parent_id: programmingId,
			},
			{
				name: "DevOps и облачные технологии",
				parent_id: programmingId,
			},
			{
				name: "Блокчейн и криптовалюты",
				parent_id: programmingId,
			},
			{
				name: "Базы данных и аналитика",
				parent_id: programmingId,
			},
			{ name: "UI/UX-дизайн", parent_id: designId },
			{
				name: "Графический дизайн",
				parent_id: designId,
			},
			{
				name: "Моушн-дизайн и анимация",
				parent_id: designId,
			},
			{
				name: "3D-моделирование и визуализация",
				parent_id: designId,
			},
			{ name: "Дизайн для печати", parent_id: designId },
			{
				name: "Дизайн для социальных сетей",
				parent_id: designId,
			},
			{ name: "SEO и SEM", parent_id: marketingId },
			{ name: "SMM", parent_id: marketingId },
			{
				name: "Контент-маркетинг",
				parent_id: marketingId,
			},
			{ name: "PPC-реклама", parent_id: marketingId },
			{
				name: "Аналитика и стратегия",
				parent_id: marketingId,
			},
			{
				name: "PR и управление репутацией",
				parent_id: marketingId,
			},
			{
				name: "Копирайтинг и редактура",
				parent_id: contentId,
			},
			{ name: "Переводы", parent_id: contentId },
			{
				name: "Транскрибация и субтитры",
				parent_id: contentId,
			},
			{
				name: "Написание технической документации",
				parent_id: contentId,
			},
			{
				name: "Создание презентаций",
				parent_id: contentId,
			},
			{
				name: "Видеопроизводство",
				parent_id: videoId,
			},
			{
				name: "Анимация и моушн-графика",
				parent_id: videoId,
			},
			{
				name: "Аудиопроизводство",
				parent_id: videoId,
			},
			{
				name: "Озвучивание и дубляж",
				parent_id: videoId,
			},
			{
				name: "Музыкальное производство",
				parent_id: videoId,
			},
			{
				name: "Управление проектами",
				parent_id: businessId,
			},
			{
				name: "Виртуальная помощь",
				parent_id: businessId,
			},
			{
				name: "Обработка данных",
				parent_id: businessId,
			},
			{
				name: "Финансовые услуги",
				parent_id: businessId,
			},
			{
				name: "Юридические консультации",
				parent_id: businessId,
			},
			{ name: "HR и рекрутинг", parent_id: businessId },
			{
				name: "Онлайн-репетиторство",
				parent_id: educationId,
			},
			{
				name: "Создание курсов",
				parent_id: educationId,
			},
			{
				name: "Коучинг и наставничество",
				parent_id: educationId,
			},
			{
				name: "Академическое письмо",
				parent_id: educationId,
			},
			{
				name: "Иллюстрации и комиксы",
				parent_id: creativeId,
			},
			{
				name: "Фотография и ретушь",
				parent_id: creativeId,
			},
			{ name: "Мода и стиль", parent_id: creativeId },
			{
				name: "Ремесла и хендмейд",
				parent_id: creativeId,
			},
			{ name: "CAD и чертежи", parent_id: engineeringId },
			{
				name: "Архитектурный дизайн",
				parent_id: engineeringId,
			},
			{
				name: "Электроника и схемотехника",
				parent_id: engineeringId,
			},
			{
				name: "Механическая инженерия",
				parent_id: engineeringId,
			},
		])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("category").execute();
}
