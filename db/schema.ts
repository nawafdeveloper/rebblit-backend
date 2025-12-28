import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const genderEnum = pgEnum('gender', ['male', 'female']);

export const profileTypeEnum = pgEnum('profile_type', [
    'user',
    'creator',
    'business',
]);

export const mediaTypeEnum = pgEnum("media_type", [
    "video",
    "picture",
]);

type ProfileStatus = {
    bann: boolean;
    suspended: boolean;
};

type PrivacySettings = {
    private_account: boolean;
    sensitive_content: boolean;
    accept_comments: boolean;
    accept_sharing: boolean;
};

type PostCaption = {
    full_text?: string | null;
    hashtags?: string[] | null;
    lang?: string | null;
};

type OriginalMediaInfo = {
    height: number;
    width: number;
    media_title: string;
    aspect_ratio: number;
};

type VideoInfo = {
    duration_millis: number;
};

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    twoFactorEnabled: boolean("two_factor_enabled").default(false),
    username: text("username").notNull().unique(),
    displayUsername: text("display_username"),
    gender: genderEnum('gender'),
    profileType: profileTypeEnum('profile_type').notNull().default('user'),
    initRegion: text('init_region'),
    platformName: text('platform_name'),
    ipCountry: text('ip_country'),
    isBadgeVerified: boolean('is_badge_verified').notNull().default(false),
    pushPackageUserId: text('push_package_user_id'),
    savesCount: integer('saves_count').notNull().default(0),
    followersCount: integer('followers_count').notNull().default(0),
    followingCount: integer('following_count').notNull().default(0),
    postsCount: integer('posts_count').notNull().default(0),
    savedPostIds: text('saved_post_ids')
        .array()
        .notNull()
        .default([]),
    profileStatus: jsonb('profile_status')
        .$type<ProfileStatus>()
        .notNull()
        .default({ bann: false, suspended: false }),
    profileBiography: text('profile_biography'),
    privacy: jsonb('privacy')
        .$type<PrivacySettings>()
        .notNull()
        .default({
            private_account: false,
            sensitive_content: false,
            accept_comments: true,
            accept_sharing: true,
        }),
    addressStreet: text('address_street'),
    cityName: text('city_name'),
    zip: text('zip'),
    profileCategory: text('profile_category'),
});

export const session = pgTable(
    "session",
    {
        id: text("id").primaryKey(),
        expiresAt: timestamp("expires_at").notNull(),
        token: text("token").notNull().unique(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
    "account",
    {
        id: text("id").primaryKey(),
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
    "verification",
    {
        id: text("id").primaryKey(),
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const twoFactor = pgTable(
    "two_factor",
    {
        id: text("id").primaryKey(),
        secret: text("secret").notNull(),
        backupCodes: text("backup_codes").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
    },
    (table) => [
        index("twoFactor_secret_idx").on(table.secret),
        index("twoFactor_userId_idx").on(table.userId),
    ],
);

export const apikey = pgTable(
    "apikey",
    {
        id: text("id").primaryKey(),
        name: text("name"),
        start: text("start"),
        prefix: text("prefix"),
        key: text("key").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        refillInterval: integer("refill_interval"),
        refillAmount: integer("refill_amount"),
        lastRefillAt: timestamp("last_refill_at"),
        enabled: boolean("enabled").default(true),
        rateLimitEnabled: boolean("rate_limit_enabled").default(true),
        rateLimitTimeWindow: integer("rate_limit_time_window").default(86400000),
        rateLimitMax: integer("rate_limit_max").default(10),
        requestCount: integer("request_count").default(0),
        remaining: integer("remaining"),
        lastRequest: timestamp("last_request"),
        expiresAt: timestamp("expires_at"),
        createdAt: timestamp("created_at").notNull(),
        updatedAt: timestamp("updated_at").notNull(),
        permissions: text("permissions"),
        metadata: text("metadata"),
    },
    (table) => [
        index("apikey_key_idx").on(table.key),
        index("apikey_userId_idx").on(table.userId),
    ],
);

export const post = pgTable(
    "posts",
    {
        id: text("id").primaryKey(),

        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),

        caption: jsonb("caption")
            .$type<PostCaption>()
            .notNull()
            .default({}),

        likesCount: integer("likes_count").notNull().default(0),
        savesCount: integer("saves_count").notNull().default(0),
        commentsCount: integer("comments_count").notNull().default(0),

        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),

        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .$onUpdate(() => new Date()),
    },
    (table) => [
        index("posts_userId_idx").on(table.userId),
        index("posts_createdAt_idx").on(table.createdAt),
    ],
);

export const postMedia = pgTable(
    "post_media",
    {
        id: text("id").primaryKey(),

        postId: text("post_id")
            .notNull()
            .references(() => post.id, { onDelete: "cascade" }),

        thumbnailUrl: text("thumbnail_url").notNull(),
        originalUrl: text("original_url").notNull(),

        mediaType: mediaTypeEnum("media_type").notNull(),
        mediaAvailability: boolean("media_availability")
            .notNull()
            .default(true),

        originalInfo: jsonb("original_info")
            .$type<OriginalMediaInfo>()
            .notNull(),

        videoInfo: jsonb("video_info")
            .$type<VideoInfo>(),

        createdAt: timestamp("created_at")
            .notNull()
            .defaultNow(),
    },
    (table) => [
        index("postMedia_postId_idx").on(table.postId),
    ],
);

export const userRelations = relations(user, ({ many }) => ({
    sessions: many(session),
    accounts: many(account),
    twoFactors: many(twoFactor),
}));

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
    user: one(user, {
        fields: [twoFactor.userId],
        references: [user.id],
    }),
}));

export const apikeyRelations = relations(apikey, ({ one }) => ({
    user: one(user, {
        fields: [apikey.userId],
        references: [user.id],
    }),
}));

export const postRelations = relations(post, ({ one, many }) => ({
    user: one(user, {
        fields: [post.userId],
        references: [user.id],
    }),
    media: many(postMedia),
}));

export const postMediaRelations = relations(postMedia, ({ one }) => ({
    post: one(post, {
        fields: [postMedia.postId],
        references: [post.id],
    }),
}));


export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;
export type UpdateUser = Partial<InferInsertModel<typeof user>>;

// ===== SESSION =====
export type Session = InferSelectModel<typeof session>;
export type NewSession = InferInsertModel<typeof session>;
export type UpdateSession = Partial<InferInsertModel<typeof session>>;

// ===== ACCOUNT =====
export type Account = InferSelectModel<typeof account>;
export type NewAccount = InferInsertModel<typeof account>;
export type UpdateAccount = Partial<InferInsertModel<typeof account>>;

// ===== VERIFICATION =====
export type Verification = InferSelectModel<typeof verification>;
export type NewVerification = InferInsertModel<typeof verification>;

// ===== TWO FACTOR =====
export type TwoFactor = InferSelectModel<typeof twoFactor>;
export type NewTwoFactor = InferInsertModel<typeof twoFactor>;

// ===== POST =====
export type Post = InferSelectModel<typeof post>;
export type NewPost = InferInsertModel<typeof post>;
export type UpdatePost = Partial<InferInsertModel<typeof post>>;

// ===== POST MEDIA =====
export type PostMedia = InferSelectModel<typeof postMedia>;
export type NewPostMedia = InferInsertModel<typeof postMedia>;
export type UpdatePostMedia = Partial<InferInsertModel<typeof postMedia>>;

/* ===== API KEY ===== */
export type ApiKey = InferSelectModel<typeof apikey>;
export type NewApiKey = InferInsertModel<typeof apikey>;
export type UpdateApiKey = Partial<InferInsertModel<typeof apikey>>;


export const schema = {
    user,
    session,
    account,
    verification,
    twoFactor,
    post,
    postMedia,
    apikey
};