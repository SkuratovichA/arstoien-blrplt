import type { FieldValues, FormRendererProps } from '@arstoien/former';

export function ButtonGroupField<T extends FieldValues>(props: FormRendererProps<T>) {
  const { form, field } = props;

  const value = form.watch(field.id);
  const { setValue } = form;
  // const error = form.formState.errors[field.id]?.message as string | undefined;

  const onClick = (value:  string) => {
    console.log('hui: ', form.control._formState)
    return setValue(field.id, value, { shouldValidate: true, shouldTouch: true, shouldDirty: true })
  }

  const options = ('options' in field ? field.options : []) as {
    label: string;
    value: string;
  }[];

  return (
    <div className="space-y-3">
      {field.label && (
        <label className="block text-sm font-medium text-gray-900">{field.label}</label>
      )}
      <div className="grid grid-cols-2 gap-4">
        {options?.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onClick(option.value)}
            className={`
              relative flex items-center justify-center rounded-lg border-2 px-6 py-8 transition-all
              ${
                value === option.value
                  ? 'border-gray-900 bg-white text-gray-900'
                  : 'border-gray-300 bg-white text-gray-900 hover:border-gray-500 hover:bg-gray-50'
              }
            `}
          >
            <div className="text-center">
              <div className="text-lg font-semibold">{option.label}</div>
              {value === option.value && (
                <div className="absolute right-3 top-3">
                  <svg className="h-5 w-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      {/*{error && (*/}
      {/*  <p className="mt-2 text-sm text-red-600">{error}</p>*/}
      {/*)}*/}
    </div>
  );
}
