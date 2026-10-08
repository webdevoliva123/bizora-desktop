import "server-only";

import fs from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";

import { getBusinessFilesDir } from "@/lib/files";

import { db } from "./index";

import {
    businesses,
    businessPaymentDetails,
    businessRegistrations,
    customerBusinessDetails,
    customerPersonDetails,
    customers,
    productCategories,
    products,
    taxRegistrations,
} from "./schema";

export interface SetupTaxRegistrationInput {
    taxSystem: string;
    registrationType: string;
    registrationNumber: string;
}

export interface SetupBusinessRegistrationInput {
    authorityName: string;
    registrationType: string;
    registrationNumber: string;
    issueDate: string;
    expiryDate: string;
}

export interface SetupPaymentDetailsInput {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchName: string;
    routingCode: string;
    paymentIdentifier: string;
    paymentInstructions: string;

    /*
     * The actual QR File is no longer required here.
     *
     * The file is already stored inside:
     *
     * business-files/.setup-temp/payment/
     *
     * We only need its relative path.
     */
    qrCodePath?: string | null;
}

export interface SetupCustomerInput {
    id: string;
    type: "person" | "business";
    firstName: string;
    lastName: string;
    businessName: string;
    contactPerson: string;
    phone: string;
    email: string;
    taxRegistration: string;
    address: string;
}

export interface SetupProductInput {
    id: string;
    name: string;
    category: string;
    unit: string;
    sellingPrice: string;
    purchasePrice: string;
    openingStock: string;
    lowStockThreshold: string;
    taxRate: string;
}

export interface SaveSetupInput {
    country: string;
    currency: string;

    businessType: string;
    businessCategory: string;

    businessName: string;

    /*
     * The actual File is no longer required.
     *
     * The logo is already stored in:
     *
     * business-files/.setup-temp/logo/
     */
    logoPath?: string | null;

    address: string;
    city: string;
    region: string;
    postalCode: string;
    phone: string;
    email: string;

    taxSystem: string;
    taxRegistrations: SetupTaxRegistrationInput[];

    businessRegistrations: SetupBusinessRegistrationInput[];
    regulatoryNotes: string;

    paymentDetails: SetupPaymentDetailsInput;

    customers: SetupCustomerInput[];

    products: SetupProductInput[];
}

interface PreparedSetupFile {
    tempPath: string;
    permanentPath: string;
    tempAbsolutePath: string;
    permanentAbsolutePath: string;
}

export async function saveSetup(
    input: SaveSetupInput,
) {
    const businessFilesDir =
        getBusinessFilesDir();

    /*
     * --------------------------------------------------------------------------
     * Prepare temporary files
     * --------------------------------------------------------------------------
     *
     * The files were already uploaded during setup.
     *
     * We now move them from:
     *
     * .setup-temp/
     *
     * to:
     *
     * business/
     *
     * before creating the final database records.
     */

    const preparedFiles: PreparedSetupFile[] = [];

    const preparedLogo =
        prepareSetupFile(
            input.logoPath,
            businessFilesDir,
            "business",
        );

    if (preparedLogo) {
        preparedFiles.push(preparedLogo);
    }

    const preparedQr =
        prepareSetupFile(
            input.paymentDetails.qrCodePath,
            businessFilesDir,
            "business",
        );

    if (preparedQr) {
        preparedFiles.push(preparedQr);
    }

    /*
     * These are the final paths that will be stored
     * inside SQLite.
     */
    const logoPath =
        preparedLogo?.permanentPath ?? null;

    const qrCodePath =
        preparedQr?.permanentPath ?? null;

    const now =
        new Date().toISOString();

    try {
        /*
         * ------------------------------------------------------------------------
         * IMPORTANT
         * ------------------------------------------------------------------------
         *
         * better-sqlite3 transactions are synchronous.
         *
         * Therefore:
         *
         * db.transaction((tx) => {})
         *
         * NOT:
         *
         * db.transaction(async (tx) => {})
         *
         * Every database operation inside this transaction
         * must also NOT use await.
         */

        const result = db.transaction((tx) => {
            /*
             * ----------------------------------------------------------------------
             * Business
             * ----------------------------------------------------------------------
             */

            const business = tx
                .insert(businesses)
                .values({
                    name: input.businessName,

                    logoPath,

                    businessType: input.businessType,

                    businessCategory:
                        input.businessCategory || null,

                    country: input.country,
                    currency: input.currency,

                    address: input.address || null,
                    city: input.city || null,
                    state: input.region || null,
                    postalCode: input.postalCode || null,

                    phone: input.phone || null,
                    email: input.email || null,

                    setupCompleted: false,

                    createdAt: now,
                    updatedAt: now,
                })
                .returning({
                    id: businesses.id,
                })
                .get();

            if (!business) {
                throw new Error(
                    "Failed to create business.",
                );
            }

            const businessId =
                business.id;

            /*
             * ----------------------------------------------------------------------
             * Tax Registrations
             * ----------------------------------------------------------------------
             */

            const taxRegistrationsToInsert =
                input.taxRegistrations
                    .filter(
                        (registration) =>
                            registration.taxSystem.trim() ||
                            registration.registrationType.trim() ||
                            registration.registrationNumber.trim(),
                    )
                    .map((registration) => ({
                        businessId,

                        country:
                            input.country,

                        taxSystem:
                            registration.taxSystem.trim(),

                        registrationNumber:
                            registration.registrationNumber.trim() ||
                            null,

                        isRegistered:
                            Boolean(
                                registration.registrationNumber.trim(),
                            ),

                        createdAt: now,
                        updatedAt: now,
                    }));

            if (
                taxRegistrationsToInsert.length > 0
            ) {
                tx
                tx
                    .insert(taxRegistrations)
                    .values(taxRegistrationsToInsert)
                    .run();
            }

            /*
             * ----------------------------------------------------------------------
             * Business / Regulatory Registrations
             * ----------------------------------------------------------------------
             */

            const businessRegistrationsToInsert =
                input.businessRegistrations
                    .filter(
                        (registration) =>
                            registration.authorityName.trim() ||
                            registration.registrationType.trim() ||
                            registration.registrationNumber.trim(),
                    )
                    .map((registration) => ({
                        businessId,

                        country:
                            input.country,

                        authorityName:
                            registration.authorityName.trim(),

                        registrationType:
                            registration.registrationType.trim(),

                        registrationNumber:
                            registration.registrationNumber.trim() ||
                            null,

                        issueDate:
                            registration.issueDate ||
                            null,

                        expiryDate:
                            registration.expiryDate ||
                            null,

                        createdAt: now,
                        updatedAt: now,
                    }));

            if (
                businessRegistrationsToInsert.length > 0
            ) {
                tx
                    .insert(businessRegistrations)
                    .values(businessRegistrationsToInsert)
                    .run();
            }

            /*
             * ----------------------------------------------------------------------
             * Payment Details
             * ----------------------------------------------------------------------
             */

            const payment =
                input.paymentDetails;

            const hasPaymentDetails =
                Boolean(
                    payment.bankName.trim(),
                ) ||
                Boolean(
                    payment.accountName.trim(),
                ) ||
                Boolean(
                    payment.accountNumber.trim(),
                ) ||
                Boolean(
                    payment.branchName.trim(),
                ) ||
                Boolean(
                    payment.routingCode.trim(),
                ) ||
                Boolean(
                    payment.paymentIdentifier.trim(),
                ) ||
                Boolean(qrCodePath) ||
                Boolean(
                    payment.paymentInstructions.trim(),
                );

            if (hasPaymentDetails) {
                tx
                    .insert(businessPaymentDetails)
                    .values({
                        businessId,

                        bankName:
                            payment.bankName.trim() || null,

                        accountName:
                            payment.accountName.trim() || null,

                        accountNumber:
                            payment.accountNumber.trim() || null,

                        branchName:
                            payment.branchName.trim() || null,

                        routingCode:
                            payment.routingCode.trim() || null,

                        paymentIdentifier:
                            payment.paymentIdentifier.trim() || null,

                        qrImagePath: qrCodePath,

                        showBankDetails: true,

                        showQr: Boolean(qrCodePath),

                        paymentInstructions:
                            payment.paymentInstructions.trim() || null,

                        createdAt: now,
                        updatedAt: now,
                    })
                    .run();
            }

            /*
             * ----------------------------------------------------------------------
             * Customers
             * ----------------------------------------------------------------------
             */

            for (
                const customer of input.customers
            ) {
                const hasCustomerData =
                    customer.firstName.trim() ||
                    customer.lastName.trim() ||
                    customer.businessName.trim() ||
                    customer.contactPerson.trim() ||
                    customer.phone.trim() ||
                    customer.email.trim() ||
                    customer.taxRegistration.trim() ||
                    customer.address.trim();

                if (!hasCustomerData) {
                    continue;
                }

                const createdCustomer =
                    tx
                        .insert(customers)
                        .values({
                            businessId,

                            type: customer.type,

                            phone:
                                customer.phone.trim() || null,

                            email:
                                customer.email.trim() || null,

                            address:
                                customer.address.trim() || null,

                            active: true,

                            createdAt: now,
                            updatedAt: now,
                        })
                        .returning({
                            id: customers.id,
                        })
                        .get();

                if (!createdCustomer) {
                    throw new Error(
                        "Failed to create customer.",
                    );
                }

                /*
                 * Person Customer
                 */
                if (
                    customer.type === "person"
                ) {
                    const firstName =
                        customer.firstName.trim();

                    if (!firstName) {
                        throw new Error(
                            "Customer first name is required for person customers.",
                        );
                    }

                    tx
                        .insert(customerPersonDetails)
                        .values({
                            customerId:
                                createdCustomer.id,

                            firstName,

                            lastName:
                                customer.lastName.trim() || null,

                            createdAt: now,
                            updatedAt: now,
                        })
                        .run();
                }

                /*
                 * Business Customer
                 */
                if (
                    customer.type === "business"
                ) {
                    const businessName =
                        customer.businessName.trim();

                    if (!businessName) {
                        throw new Error(
                            "Business name is required for business customers.",
                        );
                    }

                    tx
                        .insert(customerBusinessDetails)
                        .values({
                            customerId:
                                createdCustomer.id,

                            businessName,

                            contactPerson:
                                customer.contactPerson.trim() || null,

                            taxRegistrationNumber:
                                customer.taxRegistration.trim() || null,

                            createdAt: now,
                            updatedAt: now,
                        })
                        .run();
                }
            }

            /*
             * ----------------------------------------------------------------------
             * Products & Product Categories
             * ----------------------------------------------------------------------
             */

            const categoryIds =
                new Map<string, number>();

            for (
                const product of input.products
            ) {
                const productName =
                    product.name.trim();

                if (!productName) {
                    continue;
                }

                let categoryId:
                    | number
                    | null = null;

                const categoryName =
                    product.category.trim();

                if (categoryName) {
                    const existingCategoryId =
                        categoryIds.get(
                            categoryName.toLowerCase(),
                        );

                    if (
                        existingCategoryId
                    ) {
                        categoryId =
                            existingCategoryId;
                    } else {
                        const createdCategory =
                            tx
                                .insert(productCategories)
                                .values({
                                    businessId,

                                    name: categoryName,

                                    createdAt: now,
                                })
                                .returning({
                                    id: productCategories.id,
                                })
                                .get();

                        if (!createdCategory) {
                            throw new Error(
                                `Failed to create product category: ${categoryName}`,
                            );
                        }

                        categoryId =
                            createdCategory.id;

                        categoryIds.set(
                            categoryName.toLowerCase(),
                            createdCategory.id,
                        );
                    }
                }

                const sellingPrice =
                    parseMoneyToMinorUnits(
                        product.sellingPrice,
                    );

                const purchasePrice =
                    parseOptionalMoneyToMinorUnits(
                        product.purchasePrice,
                    );

                const openingStock =
                    parseQuantity(
                        product.openingStock,
                    );

                const lowStockThreshold =
                    parseOptionalQuantity(
                        product.lowStockThreshold,
                    );

                const taxRate =
                    parsePercentage(
                        product.taxRate,
                    );

                tx
                    .insert(products)
                    .values({
                        businessId,

                        categoryId,

                        name: productName,

                        unit:
                            product.unit.trim() || "unit",

                        sellingPrice,

                        purchasePrice,

                        currentStock:
                            openingStock,

                        lowStockThreshold,

                        taxRate,

                        active: true,

                        createdAt: now,
                        updatedAt: now,
                    })
                    .run();
            }

            // ----------------------------------------------------------------------
            // System Customer
            // ----------------------------------------------------------------------

            const walkInCustomer = tx
                .insert(customers)
                .values({
                    businessId,
                    type: "person",
                    phone: null,
                    email: null,
                    address: null,
                    city: null,
                    state: null,
                    postalCode: null,
                    active: true,
                    isSystem: true,
                    systemKey: "WALK_IN_CUSTOMER",
                    createdAt: now,
                    updatedAt: now,
                })
                .returning({
                    id: customers.id,
                })
                .get();

            if (!walkInCustomer) {
                throw new Error(
                    "Failed to create system walk-in customer.",
                );
            }

            tx
                .insert(customerPersonDetails)
                .values({
                    customerId: walkInCustomer.id,
                    firstName: "Walk-in",
                    lastName: "Customer",
                    createdAt: now,
                    updatedAt: now,
                })
                .run();


            // ----------------------------------------------------------------------
            // System Product
            // ----------------------------------------------------------------------

            tx
                .insert(products)
                .values({
                    businessId,
                    categoryId: null,
                    name: "Quick Sale",
                    unit: "sale",
                    sellingPrice: 0,
                    purchasePrice: null,
                    currentStock: 0,
                    lowStockThreshold: null,
                    taxRate: 0,
                    active: true,
                    isSystem: true,
                    systemKey: "QUICK_SALE",
                    createdAt: now,
                    updatedAt: now,
                })
                .run();

            /*
             * ----------------------------------------------------------------------
             * Complete Setup
             * ----------------------------------------------------------------------
             */
            tx
                .update(businesses)
                .set({
                    setupCompleted: true,
                    updatedAt: now,
                })
                .where(
                    eq(
                        businesses.id,
                        businessId,
                    ),
                )
                .run();

            return {
                businessId,
            };
        });

        /*
         * Database transaction succeeded.
         *
         * Now the temporary setup directory can be removed.
         */
        cleanupSetupTempDirectory();

        return {
            success: true,
            businessId:
                result.businessId,
        };
    } catch (error) {
        /*
         * Database transaction failed.
         *
         * Restore the files back into .setup-temp
         * so the user can retry setup without
         * losing their uploaded logo/QR.
         */
        rollbackPreparedFiles(
            preparedFiles,
        );

        throw error;
    }
}

/*
 * --------------------------------------------------------------------------
 * Prepare Setup File
 * --------------------------------------------------------------------------
 *
 * Moves a file from:
 *
 * .setup-temp/logo/<uuid>.png
 *
 * to:
 *
 * business/<uuid>.png
 *
 * The returned permanent path is what gets stored in SQLite.
 */

function prepareSetupFile(
    relativePath:
        | string
        | null
        | undefined,
    businessFilesDir: string,
    permanentFolder: string,
): PreparedSetupFile | null {
    if (!relativePath) {
        return null;
    }

    const normalizedPath =
        relativePath
            .replaceAll("\\", "/")
            .replace(/^\/+/, "");

    /*
     * Only allow files inside .setup-temp.
     */
    if (
        !normalizedPath.startsWith(
            ".setup-temp/",
        )
    ) {
        throw new Error(
            "Invalid setup temporary file path.",
        );
    }

    const tempAbsolutePath =
        path.resolve(
            businessFilesDir,
            normalizedPath,
        );

    const setupTempDirectory =
        path.resolve(
            businessFilesDir,
            ".setup-temp",
        );

    /*
     * Prevent directory traversal.
     */
    if (
        !tempAbsolutePath.startsWith(
            `${setupTempDirectory}${path.sep}`,
        )
    ) {
        throw new Error(
            "Invalid setup temporary file path.",
        );
    }

    if (
        !fs.existsSync(
            tempAbsolutePath,
        )
    ) {
        throw new Error(
            `Setup file not found: ${normalizedPath}`,
        );
    }

    const extension =
        path.extname(
            tempAbsolutePath,
        );

    const fileName =
        `${crypto.randomUUID()}${extension}`;

    const permanentRelativePath =
        path
            .join(
                permanentFolder,
                fileName,
            )
            .replaceAll(
                path.sep,
                "/",
            );

    const permanentAbsolutePath =
        path.resolve(
            businessFilesDir,
            permanentRelativePath,
        );

    fs.mkdirSync(
        path.dirname(
            permanentAbsolutePath,
        ),
        {
            recursive: true,
        },
    );

    fs.renameSync(
        tempAbsolutePath,
        permanentAbsolutePath,
    );

    return {
        tempPath:
            normalizedPath,

        permanentPath:
            permanentRelativePath,

        tempAbsolutePath,

        permanentAbsolutePath,
    };
}

/*
 * --------------------------------------------------------------------------
 * Rollback Files
 * --------------------------------------------------------------------------
 *
 * If SQLite fails, move files back into
 * .setup-temp so setup can be retried.
 */

function rollbackPreparedFiles(
    files: PreparedSetupFile[],
) {
    for (
        const file of files
    ) {
        try {
            if (
                !fs.existsSync(
                    file.permanentAbsolutePath,
                )
            ) {
                continue;
            }

            fs.mkdirSync(
                path.dirname(
                    file.tempAbsolutePath,
                ),
                {
                    recursive: true,
                },
            );

            fs.renameSync(
                file.permanentAbsolutePath,
                file.tempAbsolutePath,
            );
        } catch (rollbackError) {
            console.error(
                "Failed to rollback setup file:",
                rollbackError,
            );
        }
    }
}

/*
 * --------------------------------------------------------------------------
 * Cleanup Setup Temp
 * --------------------------------------------------------------------------
 */

function cleanupSetupTempDirectory() {
    const setupTempDirectory =
        path.join(
            getBusinessFilesDir(),
            ".setup-temp",
        );

    if (
        !fs.existsSync(
            setupTempDirectory,
        )
    ) {
        return;
    }

    fs.rmSync(
        setupTempDirectory,
        {
            recursive: true,
            force: true,
        },
    );
}

/*
 * --------------------------------------------------------------------------
 * Value Parsers
 * --------------------------------------------------------------------------
 */

function parseMoneyToMinorUnits(
    value: string,
): number {
    const normalized =
        value.trim();

    if (!normalized) {
        throw new Error(
            "Selling price is required.",
        );
    }

    const amount =
        Number(normalized);

    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {
        throw new Error(
            `Invalid money value: ${value}`,
        );
    }

    return Math.round(
        amount * 100,
    );
}

function parseOptionalMoneyToMinorUnits(
    value: string,
): number | null {
    const normalized =
        value.trim();

    if (!normalized) {
        return null;
    }

    const amount =
        Number(normalized);

    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {
        throw new Error(
            `Invalid money value: ${value}`,
        );
    }

    return Math.round(
        amount * 100,
    );
}

function parseQuantity(
    value: string,
): number {
    const normalized =
        value.trim();

    if (!normalized) {
        return 0;
    }

    const quantity =
        Number(normalized);

    if (
        !Number.isFinite(quantity) ||
        quantity < 0
    ) {
        throw new Error(
            `Invalid quantity value: ${value}`,
        );
    }

    return quantity;
}

function parseOptionalQuantity(
    value: string,
): number | null {
    const normalized =
        value.trim();

    if (!normalized) {
        return null;
    }

    const quantity =
        Number(normalized);

    if (
        !Number.isFinite(quantity) ||
        quantity < 0
    ) {
        throw new Error(
            `Invalid quantity value: ${value}`,
        );
    }

    return quantity;
}

function parsePercentage(
    value: string,
): number {
    const normalized =
        value.trim();

    if (!normalized) {
        return 0;
    }

    const percentage =
        Number(normalized);

    if (
        !Number.isFinite(percentage) ||
        percentage < 0 ||
        percentage > 100
    ) {
        throw new Error(
            `Invalid tax rate: ${value}`,
        );
    }

    return percentage;
}