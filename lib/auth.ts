import db from "@/db";
import { schema } from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey, emailOTP, twoFactor, username } from "better-auth/plugins";

export const auth = betterAuth({
    appName: "Rebblit",
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            gender: {
                type: "string",
            },
            profileType: {
                type: "string",
                defaultValue: "user"
            },
            initRegion: {
                type: "string",
            },
            platformName: {
                type: "string",
            },
            ipCountry: {
                type: "string",
            },
            isBadgeVerified: {
                type: "boolean",
                defaultValue: false
            },
            pushPackageUserId: {
                type: "string",
            },
            savesCount: {
                type: "number",
                defaultValue: 0
            },
            followersCount: {
                type: "number",
                defaultValue: 0
            },
            followingCount: {
                type: "number",
                defaultValue: 0
            },
            postsCount: {
                type: "number",
                defaultValue: 0
            },
            savedPostIds: {
                type: "string[]"
            },
            profileStatus: {
                type: "json"
            },
            profileBiography: {
                type: "string"
            },
            privacy: {
                type: "json"
            },
            addressStreet: {
                type: "string"
            },
            cityName: {
                type: "string"
            },
            zip: {
                type: "string"
            },
            profileCategory: {
                type: "string"
            },
        }
    },
    allowMissingOrigin: true,
    trustedOrigins: [
        "http://localhost:3000",
        "https://rebblit-backend.vercel.app",
        "transitiontest://",
    ],
    plugins: [
        twoFactor(),
        username(),
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                if (type === "sign-in") {
                    console.log('otp send to: ', email, 'otp is: ', otp);
                } else if (type === "email-verification") {
                    console.log('otp send to: ', email, 'otp is: ', otp);
                } else {
                    console.log('otp send to: ', email, 'otp is: ', otp);
                }
            },
        }),
        apiKey()
    ]
});