/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Snippet } from 'svelte';
import * as FieldComponent from '$lib/components/ui/field';

export type FieldState<T> = {
	value: T;
	error: string | undefined;
	touched: boolean;
	dirty: boolean;
};

export type FormState<T extends Record<string, any>> = {
	values: T;
	errors: Partial<Record<keyof T, string>>;
	touched: Partial<Record<keyof T, boolean>>;
	dirty: Partial<Record<keyof T, boolean>>;
	isSubmitting: boolean;
	isValid: boolean;
};

export type FieldProps<T> = {
	children: Snippet<[FieldApi<T>]>;
	orientation?: 'vertical' | 'horizontal' | 'responsive';
};

type FieldApi<T> = {
	value: T;
	error: string | undefined;
	touched: boolean;
	dirty: boolean;
	isDirty: boolean;
	isValid: boolean;
	setValue: (value: T) => void;
	setTouched: (touched: boolean) => void;
	validate: () => Promise<void>;
	attrs: {
		'data-invalid': boolean | undefined;
	};
	evt: {
		oninput: (e: Event) => void;
		onblur: (e: Event) => void;
	};
};

export function createForm<
	Schema extends StandardSchemaV1<T>,
	T extends Record<string, any> = StandardSchemaV1.InferInput<Schema>
>(config: {
	defaultValues: T;
	schema: Schema;
	onSubmit: (values: StandardSchemaV1.InferOutput<Schema>) => void | Promise<void>;
}) {
	// Core state
	let values = $state<T>(structuredClone(config.defaultValues));
	let errors = $state<Partial<Record<keyof T, string>>>({});
	let touched = $state<Partial<Record<keyof T, boolean>>>({});
	let dirty = $state<Partial<Record<keyof T, boolean>>>({});
	let isSubmitting = $state(false);

	// Derived state
	const isValid = $derived(Object.keys(errors).length === 0);
	const isDirty = $derived(Object.values(dirty).some(Boolean));
	class CreateState<K extends keyof T> {
		value = $state<T[K]>();
		errors = $state<Partial<Record<keyof T, string>>>({});
		touched = $state(false);
		isValid = $derived(Object.keys(this.errors).length === 0);
		isDirty = $derived(Object.values(this.errors).some(Boolean));
		atts = $derived({
			'data-invalid': !isValid && touched ? true : undefined
		});
		constructor(public key: K) {
			this.value = config.defaultValues[key];
		}
		validate = async () => {
			const result = await config.schema['~standard'].validate(this.value);

			if (result.issues) {
				const fieldIssue = result.issues.find((issue) => issue.path?.[0] === this.key);

				if (fieldIssue) {
					this.errors = { ...this.errors, [this.key]: fieldIssue.message };
				} else {
					const { [this.key]: _, ...rest } = this.errors;
					this.errors = rest as any;
				}
			} else {
				const { [this.key]: _, ...rest } = this.errors;
				this.errors = rest as any;
			}
		};
		evt = {
			oninput: () => {
				this.validate();
			},
			onblur: () => {
				this.touched = true;
			}
		};
	}

	// Validate entire form
	async function validate(): Promise<boolean> {
		try {
			const result = await config.schema['~standard'].validate(values);

			if (result.issues) {
				const newErrors: Partial<Record<keyof T, string>> = {};
				for (const issue of result.issues) {
					const path = issue.path?.[0] as keyof T;
					if (path && !newErrors[path]) {
						newErrors[path] = issue.message;
					}
				}
				errors = newErrors;
				return false;
			}

			errors = {};
			return true;
		} catch (err) {
			console.error('Validation error:', err);
			return false;
		}
	}

	// Validate single field
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async function validateField<K extends keyof T>(name: K): Promise<void> {
		try {
			const result = await config.schema['~standard'].validate(values);

			if (result.issues) {
				const fieldIssue = result.issues.find((issue) => issue.path?.[0] === name);

				if (fieldIssue) {
					errors = { ...errors, [name]: fieldIssue.message };
				} else {
					const { [name]: _, ...rest } = errors;
					errors = rest as any;
				}
			} else {
				const { [name]: _, ...rest } = errors;
				errors = rest as any;
			}
		} catch (err) {
			console.error('Field validation error:', err);
		}
	}

	// Field API factory
	// const field: { [K in keyof T]: FieldApi<T[K]> } = $state(
	// 	Object.keys(config.defaultValues).reduce((acc, name) => {
	// 		return {
	// 			...acc,
	// 			[name]: {
	// 				get value() {
	// 					return values[name];
	// 				},
	// 				set value(newVal) {
	// 					this.setValue(newVal);
	// 				},
	// 				get error() {
	// 					return errors[name];
	// 				},
	// 				get touched() {
	// 					return touched[name] ?? false;
	// 				},
	// 				get dirty() {
	// 					return dirty[name] ?? false;
	// 				},
	// 				get isDirty() {
	// 					return dirty[name] ?? false;
	// 				},
	// 				get isValid() {
	// 					return !errors[name];
	// 				},
	// 				get attrs() {
	// 					return {
	// 						'data-invalid': errors[name] && touched[name] ? true : undefined
	// 					};
	// 				},
	// 				setValue: (value: any) => {
	// 					values = { ...values, [name]: value };
	// 					dirty = { ...dirty, [name]: true };
	// 					validateField(name);
	// 				},
	// 				setTouched: (isTouched: boolean) => {
	// 					touched = { ...touched, [name]: isTouched };
	// 					if (isTouched) {
	// 						validateField(name);
	// 					}
	// 				},
	// 				validate: () => validateField(name),
	// 				evt: {
	// 					oninput: () => {
	// 						field[name].validate();
	// 					},
	// 					onblur: () => {
	// 						field[name].setTouched(true);
	// 					}
	// 				}
	// 			}
	// 		};
	// 	}, {}) as { [K in keyof T]: FieldApi<T[K]> }
	// );
	const field = $state(
		Object.keys(config.defaultValues).reduce((acc, name) => {
			return {
				...acc,
				[name]: new CreateState(name as keyof T)
			};
		}, {}) as { [K in keyof T]: CreateState<K> }
	);
	// Field component factory - returns a component that wraps shadcn Field

	// Handle form submission
	async function handleSubmit(e?: Event) {
		e?.preventDefault();

		// Mark all fields as touched
		const allTouched = Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {});
		touched = allTouched;

		// Validate
		const valid = await validate();
		if (!valid) return;

		// Submit
		isSubmitting = true;
		try {
			await config.onSubmit(values);
		} finally {
			isSubmitting = false;
		}
	}

	// Reset form
	function reset() {
		values = structuredClone(config.defaultValues);
		errors = {};
		touched = {};
		dirty = {};
		isSubmitting = false;
	}

	// Set values programmatically
	function setValues(newValues: Partial<T>) {
		values = { ...values, ...newValues };
		Object.keys(newValues).forEach((key) => {
			dirty = { ...dirty, [key]: true };
		});
		validate();
	}

	return {
		form: {
			// State getters
			get values() {
				return values;
			},
			get errors() {
				return errors;
			},
			get touched() {
				return touched;
			},
			get dirty() {
				return dirty;
			},
			get isSubmitting() {
				return isSubmitting;
			},
			get isValid() {
				return isValid;
			},
			get isDirty() {
				return isDirty;
			},

			// Methods
			field,
			// Field,
			handleSubmit,
			validate,
			reset,
			setValues
		},
		Field: {
			...FieldComponent
		}
	};
}

// Example usage with Valibot (implements Standard Schema):
/*
import * as v from 'valibot';
import * as Field from '$lib/components/ui/field';
import { Input } from '$lib/components/ui/input';

const schema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
  age: v.pipe(v.number(), v.minValue(18)),
});

const form = createForm({
  defaultValues: {
    email: '',
    password: '',
    age: 0,
  },
  schema,
  onSubmit: async (values) => {
    console.log('Submitted:', values);
  },
});

// Method 1: Using Field API directly
const emailField = form.field('email');

<Field.Field {...emailField.attrs}>
  <Field.Label for="email">Email</Field.Label>
  <Input
    id="email"
    type="email"
    value={emailField.value}
    oninput={(e) => emailField.setValue(e.currentTarget.value)}
    onblur={() => emailField.setTouched(true)}
    aria-invalid={emailField.error && emailField.touched}
  />
  {#if emailField.touched && emailField.error}
    <Field.Error>{emailField.error}</Field.Error>
  {/if}
</Field.Field>

// Method 2: Using Field factory (more TanStack-like)
const emailFieldConfig = form.Field('email');

<Field.Field {...emailFieldConfig.api.attrs} orientation={emailFieldConfig.orientation}>
  <Field.Label for="email">Email</Field.Label>
  <Input
    id="email"
    type="email"
    value={emailFieldConfig.api.value}
    oninput={(e) => emailFieldConfig.api.setValue(e.currentTarget.value)}
    onblur={() => emailFieldConfig.api.setTouched(true)}
    aria-invalid={emailFieldConfig.api.error && emailFieldConfig.api.touched}
  />
  {#if emailFieldConfig.api.touched && emailFieldConfig.api.error}
    <Field.Error>{emailFieldConfig.api.error}</Field.Error>
  {/if}
</Field.Field>

// Method 3: Full example with proper structure
<form onsubmit={form.handleSubmit}>
  <Field.Set>
    <Field.Legend>Login</Field.Legend>
    <Field.Description>Enter your credentials</Field.Description>
    
    <Field.Group>
      {#each [
        { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
        { name: 'password', label: 'Password', type: 'password', placeholder: '********' },
      ] as fieldConfig}
        {@const api = form.field(fieldConfig.name)}
        <Field.Field {...api.attrs}>
          <Field.Label for={fieldConfig.name}>{fieldConfig.label}</Field.Label>
          <Input
            id={fieldConfig.name}
            type={fieldConfig.type}
            placeholder={fieldConfig.placeholder}
            value={api.value}
            oninput={(e) => api.setValue(e.currentTarget.value)}
            onblur={() => api.setTouched(true)}
            aria-invalid={api.error && api.touched}
          />
          {#if api.touched && api.error}
            <Field.Error>{api.error}</Field.Error>
          {/if}
        </Field.Field>
      {/each}
    </Field.Group>
  </Field.Set>
  
  <button type="submit" disabled={form.isSubmitting || !form.isValid}>
    {form.isSubmitting ? 'Submitting...' : 'Submit'}
  </button>
</form>
*/
