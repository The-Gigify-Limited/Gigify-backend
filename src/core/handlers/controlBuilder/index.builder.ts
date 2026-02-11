import type { AnyFunction } from '@/core/types';
import { Permission, ResourceAuthorizationOptions, Resources, Role } from '~/auth/interface';
import { ControllerHandler } from './index.handler';
import { ControllerHandlerOptions, ValidationSchema } from './index.interface';

/**
 * Builder class for setting up and configuring a controller handler.
 * This class allows fluent style configuration by chaining method calls.
 */
export class ControlBuilder {
    private handler!: AnyFunction;

    private schema: ValidationSchema | undefined;

    private options: ControllerHandlerOptions = {
        isPrivate: false,
    };

    private requiredPermissions: Permission[] = [];

    private resourceOwnershipCheck?: ResourceAuthorizationOptions;

    /**
     * Initializes and returns a new instance of ControlBuilder.
     * @returns {ControlBuilder} A new instance of ControlBuilder.
     * @static
     */
    static builder() {
        return new ControlBuilder();
    }

    /**
     * Sets the handler function that will be used to process requests.
     * @param {AnyFunction} func - The function to handle the request.
     * @returns {ControlBuilder} The instance of this builder for chaining.
     */
    setHandler(func: AnyFunction) {
        this.handler = func;
        return this;
    }

    /**
     * Sets the validation schema for validating request data.
     * @param {ValidationSchema} schema - The schema to validate the request data.
     * @returns {ControlBuilder} The instance of this builder for chaining.
     */
    setValidator(schema: ValidationSchema) {
        this.schema = schema;
        return this;
    }

    /**
     * Marks the route as requiring authentication.
     * @returns {ControlBuilder} The instance of this builder for chaining.
     */
    isPrivate() {
        this.options = { ...this.options, isPrivate: true };

        return this;
    }

    /**
     * Requires specific permissions to access the route.
     * @param {...Permission[]} permissions - The permissions required.
     * @returns {ControlBuilder} The instance of this builder for chaining.
     */
    requirePermissions(...permissions: Permission[]) {
        this.requiredPermissions = permissions;
        return this;
    }

    /**
     * Checks if user owns the resource before allowing access
     * @param resourceType - Type of resource (user, gig, review, payment)
     * @param paramName - The param name containing resource ID (default: 'id')
     * @param adminCanBypass - Allow admins to bypass ownership check (default: true)
     * @returns {ControlBuilder} The instance of this builder for chaining
     */
    checkResourceOwnership(resourceType: Resources, paramName: string = 'id', adminCanBypass: boolean = true) {
        this.resourceOwnershipCheck = {
            resourceType,
            paramName,
            adminCanBypass,
        };

        return this;
    }

    /**
     * Specifies roles allowed to access the route. Automatically marks the route as private.
     * @param {...Role[]} allowed - An array of allowed roles.
     * @returns {ControlBuilder} The instance of this builder for chaining.
     */
    only(...allowed: Role[]) {
        this.options = { isPrivate: true, allowedRoles: allowed };

        return this;
    }

    /**
     * Builds and returns the controller handler with the configured settings.
     * @returns {ExpressCallbackFunction} The middleware function that handles the request.
     */
    handle() {
        return new ControllerHandler().handle(this.handler, this.schema, {
            ...this.options,
            requiredPermissions: this.requiredPermissions,
            checkResourceOwnership: this.resourceOwnershipCheck,
        });
    }
}
