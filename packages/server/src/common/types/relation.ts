/**
 * Wraps the type of a dependency whose module sits in an import cycle.
 * TypeScript writes a reference to a class into the decorator metadata, and in ES modules that reference throws a ReferenceError while the other module of the cycle is still loading.
 * A type alias is written as Object instead, and Nest still resolves the real class through @Inject(forwardRef(() => Class)).
 */
export type Relation<T> = T;
