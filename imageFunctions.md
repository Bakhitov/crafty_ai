
# Image

The `Image` component displays AI-generated images from the AI SDK. It accepts a [`Experimental_GeneratedImage`](/docs/reference/ai-sdk-core/generate-image) object from the AI SDK's `generateImage` function and automatically renders it as an image.

<Preview path="image" />

## Installation

```sh
npx ai-elements@latest add image
```

## Usage

```tsx
import { Image } from '@/components/ai-elements/image';
```

```tsx
<Image
  base64="valid base64 string"
  mediaType: 'image/jpeg',
  uint8Array: new Uint8Array([]),
  alt="Example generated image"
  className="h-[150px] aspect-square border"
/>
```

## Usage with AI SDK

Build a simple app allowing a user to generate an image given a prompt.

Install the `@ai-sdk/openai` package:

<div className="my-4">
  <Tabs items={['pnpm', 'npm', 'yarn']}>
    <Tab>
      <Snippet text="pnpm add @ai-sdk/openai" dark />
    </Tab>
    <Tab>
      <Snippet text="npm install @ai-sdk/openai" dark />
    </Tab>
    <Tab>
      <Snippet text="yarn add @ai-sdk/openai" dark />
    </Tab>
  </Tabs>
</div>

Add the following component to your frontend:

```tsx filename="app/page.tsx"
'use client';

import { Image } from '@/components/ai-elements/image';
import {
  Input,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { useState } from 'react';
import { Loader } from '@/components/ai-elements/loader';

const ImageDemo = () => {
  const [prompt, setPrompt] = useState('A futuristic cityscape at sunset');
  const [imageData, setImageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setPrompt('');

    setIsLoading(true);
    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();

      setImageData(data);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full rounded-lg border h-[600px]">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4">
          {imageData && (
            <div className="flex justify-center">
              <Image
                {...imageData}
                alt="Generated image"
                className="h-[300px] aspect-square border rounded-lg"
              />
            </div>
          )}
          {isLoading && <Loader />}
        </div>

        <Input
          onSubmit={handleSubmit}
          className="mt-4 w-full max-w-2xl mx-auto relative"
        >
          <PromptInputTextarea
            value={prompt}
            placeholder="Describe the image you want to generate..."
            onChange={(e) => setPrompt(e.currentTarget.value)}
            className="pr-12"
          />
          <PromptInputSubmit
            status={isLoading ? 'submitted' : 'ready'}
            disabled={!prompt.trim()}
            className="absolute bottom-1 right-1"
          />
        </Input>
      </div>
    </div>
  );
};

export default ImageDemo;
```

Add the following route to your backend:

```ts filename="app/api/image/route.ts"
import { openai } from '@ai-sdk/openai';
import { experimental_generateImage } from 'ai';

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const { image } = await experimental_generateImage({
    model: openai.image('dall-e-3'),
    prompt: prompt,
    size: '1024x1024',
  });

  return Response.json({
    base64: image.base64,
    uint8Array: image.uint8Array,
    mediaType: image.mediaType,
  });
}
```

## Features

- Accepts `Experimental_GeneratedImage` objects directly from the AI SDK
- Automatically creates proper data URLs from base64-encoded image data
- Supports all standard HTML image attributes
- Responsive by default with `max-w-full h-auto` styling
- Customizable with additional CSS classes
- Includes proper TypeScript types for AI SDK compatibility

## Props

### `<Image />`

<PropertiesTable
  content={[
    {
      name: 'alt',
      type: 'string',
      description: 'Alternative text for the image.',
      isOptional: true,
    },
    {
      name: 'className',
      type: 'string',
      description: 'Additional CSS classes to apply to the image.',
      isOptional: true,
    },
    {
      name: '[...props]',
      type: 'Experimental_GeneratedImage',
      description: 'The image data to display, as returned by the AI SDK.',
      isOptional: true,
    },
  ]}
/>

# `generateImage()`

<Note type="warning">`generateImage` is an experimental feature.</Note>

Generates images based on a given prompt using an image model.

It is ideal for use cases where you need to generate images programmatically,
such as creating visual content or generating images for data augmentation.

```ts
import { experimental_generateImage as generateImage } from 'ai';

const { images } = await generateImage({
  model: openai.image('dall-e-3'),
  prompt: 'A futuristic cityscape at sunset',
  n: 3,
  size: '1024x1024',
});

console.log(images);
```

## Import

<Snippet
  text={`import { experimental_generateImage as generateImage } from "ai"`}
  prompt={false}
/>

## API Signature

### Parameters

<PropertiesTable
  content={[
    {
      name: 'model',
      type: 'ImageModelV2',
      description: 'The image model to use.',
    },
    {
      name: 'prompt',
      type: 'string',
      description: 'The input prompt to generate the image from.',
    },
    {
      name: 'n',
      type: 'number',
      isOptional: true,
      description: 'Number of images to generate.',
    },
    {
      name: 'size',
      type: 'string',
      isOptional: true,
      description:
        'Size of the images to generate. Format: `{width}x{height}`.',
    },
    {
      name: 'aspectRatio',
      type: 'string',
      isOptional: true,
      description:
        'Aspect ratio of the images to generate. Format: `{width}:{height}`.',
    },
    {
      name: 'seed',
      type: 'number',
      isOptional: true,
      description: 'Seed for the image generation.',
    },
    {
      name: 'providerOptions',
      type: 'ProviderOptions',
      isOptional: true,
      description: 'Additional provider-specific options.',
    },
    {
      name: 'maxRetries',
      type: 'number',
      isOptional: true,
      description: 'Maximum number of retries. Default: 2.',
    },
    {
      name: 'abortSignal',
      type: 'AbortSignal',
      isOptional: true,
      description: 'An optional abort signal to cancel the call.',
    },
    {
      name: 'headers',
      type: 'Record<string, string>',
      isOptional: true,
      description: 'Additional HTTP headers for the request.',
    },
  ]}
/>

### Returns

<PropertiesTable
  content={[
    {
      name: 'image',
      type: 'GeneratedFile',
      description: 'The first image that was generated.',
      properties: [
        {
          type: 'GeneratedFile',
          parameters: [
            {
              name: 'base64',
              type: 'string',
              description: 'Image as a base64 encoded string.',
            },
            {
              name: 'uint8Array',
              type: 'Uint8Array',
              description: 'Image as a Uint8Array.',
            },
            {
              name: 'mediaType',
              type: 'string',
              description: 'The IANA media type of the image.',
            },
          ],
        },
      ],
    },
    {
      name: 'images',
      type: 'Array<GeneratedFile>',
      description: 'All images that were generated.',
      properties: [
        {
          type: 'GeneratedFile',
          parameters: [
            {
              name: 'base64',
              type: 'string',
              description: 'Image as a base64 encoded string.',
            },
            {
              name: 'uint8Array',
              type: 'Uint8Array',
              description: 'Image as a Uint8Array.',
            },
            {
              name: 'mediaType',
              type: 'string',
              description: 'The IANA media type of the image.',
            },
          ],
        },
      ],
    },
    {
      name: 'warnings',
      type: 'ImageGenerationWarning[]',
      description:
        'Warnings from the model provider (e.g. unsupported settings).',
    },
    {
      name: 'providerMetadata',
      type: 'ImageModelProviderMetadata',
      isOptional: true,
      description:
        'Optional metadata from the provider. The outer key is the provider name. The inner values are the metadata. An `images` key is always present in the metadata and is an array with the same length as the top level `images` key. Details depend on the provider.',
    },
    {
      name: 'responses',
      type: 'Array<ImageModelResponseMetadata>',
      description:
        'Response metadata from the provider. There may be multiple responses if we made multiple calls to the model.',
      properties: [
        {
          type: 'ImageModelResponseMetadata',
          parameters: [
            {
              name: 'timestamp',
              type: 'Date',
              description: 'Timestamp for the start of the generated response.',
            },
            {
              name: 'modelId',
              type: 'string',
              description:
                'The ID of the response model that was used to generate the response.',
            },
            {
              name: 'headers',
              type: 'Record<string, string>',
              isOptional: true,
              description: 'Response headers.',
            },
          ],
        },
      ],
    },
  ]}
/>

# `ModelMessage`

`ModelMessage` represents the fundamental message structure used with AI SDK Core functions.
It encompasses various message types that can be used in the `messages` field of any AI SDK Core functions.

You can access the Zod schema for `ModelMessage` with the `modelMessageSchema` export.

## `ModelMessage` Types

### `SystemModelMessage`

A system message that can contain system information.

```typescript
type SystemModelMessage = {
  role: 'system';
  content: string;
};
```

You can access the Zod schema for `SystemModelMessage` with the `systemModelMessageSchema` export.

<Note>
  Using the "system" property instead of a system message is recommended to
  enhance resilience against prompt injection attacks.
</Note>

### `UserModelMessage`

A user message that can contain text or a combination of text, images, and files.

```typescript
type UserModelMessage = {
  role: 'user';
  content: UserContent;
};

type UserContent = string | Array<TextPart | ImagePart | FilePart>;
```

You can access the Zod schema for `UserModelMessage` with the `userModelMessageSchema` export.

### `AssistantModelMessage`

An assistant message that can contain text, tool calls, or a combination of both.

```typescript
type AssistantModelMessage = {
  role: 'assistant';
  content: AssistantContent;
};

type AssistantContent = string | Array<TextPart | ToolCallPart>;
```

You can access the Zod schema for `AssistantModelMessage` with the `assistantModelMessageSchema` export.

### `ToolModelMessage`

A tool message that contains the result of one or more tool calls.

```typescript
type ToolModelMessage = {
  role: 'tool';
  content: ToolContent;
};

type ToolContent = Array<ToolResultPart>;
```

You can access the Zod schema for `ToolModelMessage` with the `toolModelMessageSchema` export.

## `ModelMessage` Parts

### `TextPart`

Represents a text content part of a prompt. It contains a string of text.

```typescript
export interface TextPart {
  type: 'text';
  /**
   * The text content.
   */
  text: string;
}
```

### `ImagePart`

Represents an image part in a user message.

```typescript
export interface ImagePart {
  type: 'image';

  /**
   * Image data. Can either be:
   * - data: a base64-encoded string, a Uint8Array, an ArrayBuffer, or a Buffer
   * - URL: a URL that points to the image
   */
  image: DataContent | URL;

  /**
   * Optional IANA media type of the image.
   * We recommend leaving this out as it will be detected automatically.
   */
  mediaType?: string;
}
```

### `FilePart`

Represents an file part in a user message.

```typescript
export interface FilePart {
  type: 'file';

  /**
   * File data. Can either be:
   * - data: a base64-encoded string, a Uint8Array, an ArrayBuffer, or a Buffer
   * - URL: a URL that points to the file
   */
  data: DataContent | URL;

  /**
   * Optional filename of the file.
   */
  filename?: string;

  /**
   * IANA media type of the file.
   */
  mediaType: string;
}
```

### `ToolCallPart`

Represents a tool call content part of a prompt, typically generated by the AI model.

```typescript
export interface ToolCallPart {
  type: 'tool-call';

  /**
   * ID of the tool call. This ID is used to match the tool call with the tool result.
   */
  toolCallId: string;

  /**
   * Name of the tool that is being called.
   */
  toolName: string;

  /**
   * Arguments of the tool call. This is a JSON-serializable object that matches the tool's input schema.
   */
  args: unknown;
}
```

### `ToolResultPart`

Represents the result of a tool call in a tool message.

```typescript
export interface ToolResultPart {
  type: 'tool-result';

  /**
   * ID of the tool call that this result is associated with.
   */
  toolCallId: string;

  /**
   * Name of the tool that generated this result.
   */
  toolName: string;

  /**
   * Result of the tool call. This is a JSON-serializable object.
   */
  output: LanguageModelV2ToolResultOutput;

  /**
  Additional provider-specific metadata. They are passed through
  to the provider from the AI SDK and enable provider-specific
  functionality that can be fully encapsulated in the provider.
  */
  providerOptions?: ProviderOptions;
}
```

### `LanguageModelV2ToolResultOutput`

```ts
export type LanguageModelV2ToolResultOutput =
  | { type: 'text'; value: string }
  | { type: 'json'; value: JSONValue }
  | { type: 'error-text'; value: string }
  | { type: 'error-json'; value: JSONValue }
  | {
      type: 'content';
      value: Array<
        | {
            type: 'text';

            /**
          Text content.
            */
            text: string;
          }
        | {
            type: 'media';

            /**
          Base-64 encoded media data.
            */
            data: string;

            /**
          IANA media type.
          @see https://www.iana.org/assignments/media-types/media-types.xhtml
            */
            mediaType: string;
          }
      >;
    };
```

# `createProviderRegistry()`

When you work with multiple providers and models, it is often desirable to manage them
in a central place and access the models through simple string ids.

`createProviderRegistry` lets you create a registry with multiple providers that you
can access by their ids in the format `providerId:modelId`.

### Setup

You can create a registry with multiple providers and models using `createProviderRegistry`.

```ts
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createProviderRegistry } from 'ai';

export const registry = createProviderRegistry({
  // register provider with prefix and default setup:
  anthropic,

  // register provider with prefix and custom setup:
  openai: createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),
});
```

### Custom Separator

By default, the registry uses `:` as the separator between provider and model IDs. You can customize this separator by passing a `separator` option:

```ts
const registry = createProviderRegistry(
  {
    anthropic,
    openai,
  },
  { separator: ' > ' },
);

// Now you can use the custom separator
const model = registry.languageModel('anthropic > claude-3-opus-20240229');
```

### Language models

You can access language models by using the `languageModel` method on the registry.
The provider id will become the prefix of the model id: `providerId:modelId`.

```ts highlight={"5"}
import { generateText } from 'ai';
import { registry } from './registry';

const { text } = await generateText({
  model: registry.languageModel('openai:gpt-4.1'),
  prompt: 'Invent a new holiday and describe its traditions.',
});
```

### Text embedding models

You can access text embedding models by using the `textEmbeddingModel` method on the registry.
The provider id will become the prefix of the model id: `providerId:modelId`.

```ts highlight={"5"}
import { embed } from 'ai';
import { registry } from './registry';

const { embedding } = await embed({
  model: registry.textEmbeddingModel('openai:text-embedding-3-small'),
  value: 'sunny day at the beach',
});
```

### Image models

You can access image models by using the `imageModel` method on the registry.
The provider id will become the prefix of the model id: `providerId:modelId`.

```ts highlight={"5"}
import { generateImage } from 'ai';
import { registry } from './registry';

const { image } = await generateImage({
  model: registry.imageModel('openai:dall-e-3'),
  prompt: 'A beautiful sunset over a calm ocean',
});
```

## Import

<Snippet text={`import { createProviderRegistry } from "ai"`} prompt={false} />

## API Signature

### Parameters

<PropertiesTable
  content={[
    {
      name: 'providers',
      type: 'Record<string, Provider>',
      description:
        'The unique identifier for the provider. It should be unique within the registry.',
      properties: [
        {
          type: 'Provider',
          parameters: [
            {
              name: 'languageModel',
              type: '(id: string) => LanguageModel',
              description:
                'A function that returns a language model by its id.',
            },
            {
              name: 'textEmbeddingModel',
              type: '(id: string) => EmbeddingModel<string>',
              description:
                'A function that returns a text embedding model by its id.',
            },
            {
              name: 'imageModel',
              type: '(id: string) => ImageModel',
              description: 'A function that returns an image model by its id.',
            },
          ],
        },
      ],
    },
    {
      name: 'options',
      type: 'object',
      description: 'Optional configuration for the registry.',
      properties: [
        {
          type: 'Options',
          parameters: [
            {
              name: 'separator',
              type: 'string',
              description:
                'Custom separator between provider and model IDs. Defaults to ":".',
            },
          ],
        },
      ],
    },
  ]}
/>

### Returns

The `createProviderRegistry` function returns a `Provider` instance. It has the following methods:

<PropertiesTable
  content={[
    {
      name: 'languageModel',
      type: '(id: string) => LanguageModel',
      description:
        'A function that returns a language model by its id (format: providerId:modelId)',
    },
    {
      name: 'textEmbeddingModel',
      type: '(id: string) => EmbeddingModel<string>',
      description:
        'A function that returns a text embedding model by its id (format: providerId:modelId)',
    },
    {
      name: 'imageModel',
      type: '(id: string) => ImageModel',
      description:
        'A function that returns an image model by its id (format: providerId:modelId)',
    },
  ]}
/>

# `customProvider()`

With a custom provider, you can map ids to any model.
This allows you to set up custom model configurations, alias names, and more.
The custom provider also supports a fallback provider, which is useful for
wrapping existing providers and adding additional functionality.

### Example: custom model settings

You can create a custom provider using `customProvider`.

```ts
import { openai } from '@ai-sdk/openai';
import { customProvider } from 'ai';

// custom provider with different model settings:
export const myOpenAI = customProvider({
  languageModels: {
    // replacement model with custom settings:
    'gpt-4': wrapLanguageModel({
      model: openai('gpt-4'),
      middleware: defaultSettingsMiddleware({
        settings: {
          providerOptions: {
            openai: {
              reasoningEffort: 'high',
            },
          },
        },
      }),
    }),
    // alias model with custom settings:
    'gpt-4o-reasoning-high': wrapLanguageModel({
      model: openai('gpt-4o'),
      middleware: defaultSettingsMiddleware({
        settings: {
          providerOptions: {
            openai: {
              reasoningEffort: 'high',
            },
          },
        },
      }),
    }),
  },
  fallbackProvider: openai,
});
```

## Import

<Snippet text={`import {  customProvider } from "ai"`} prompt={false} />

## API Signature

### Parameters

<PropertiesTable
  content={[
    {
      name: 'languageModels',
      type: 'Record<string, LanguageModel>',
      isOptional: true,
      description:
        'A record of language models, where keys are model IDs and values are LanguageModel instances.',
    },
    {
      name: 'textEmbeddingModels',
      type: 'Record<string, EmbeddingModel<string>>',
      isOptional: true,
      description:
        'A record of text embedding models, where keys are model IDs and values are EmbeddingModel<string> instances.',
    },
    {
      name: 'imageModels',
      type: 'Record<string, ImageModel>',
      isOptional: true,
      description:
        'A record of image models, where keys are model IDs and values are ImageModelV2 instances.',
    },
    {
      name: 'fallbackProvider',
      type: 'Provider',
      isOptional: true,
      description:
        'An optional fallback provider to use when a requested model is not found in the custom provider.',
    },
  ]}
/>

### Returns

The `customProvider` function returns a `Provider` instance. It has the following methods:

<PropertiesTable
  content={[
    {
      name: 'languageModel',
      type: '(id: string) => LanguageModel',
      description:
        'A function that returns a language model by its id (format: providerId:modelId)',
    },
    {
      name: 'textEmbeddingModel',
      type: '(id: string) => EmbeddingModel<string>',
      description:
        'A function that returns a text embedding model by its id (format: providerId:modelId)',
    },
    {
      name: 'imageModel',
      type: '(id: string) => ImageModel',
      description:
        'A function that returns an image model by its id (format: providerId:modelId)',
    },
  ]}
/>

# Automatic1111

[AUTOMATIC1111](https://github.com/AUTOMATIC1111/stable-diffusion-webui) is a popular web interface for Stable Diffusion that provides a comprehensive set of features for image generation. The [Automatic1111 provider](https://github.com/Ponesicek/automatic1111-provider) for the AI SDK enables seamless integration with locally hosted AUTOMATIC1111 instances while offering unique advantages:

- **Local Control**: Full control over your image generation with local Stable Diffusion models
- **No API Costs**: Generate unlimited images without per-request charges
- **Model Flexibility**: Use any Stable Diffusion checkpoint
- **Privacy**: All generation happens locally on your hardware
- **Community Models**: Access to thousands of community-created models from Civitai and HuggingFace

Learn more about AUTOMATIC1111's capabilities in the [AUTOMATIC1111 Documentation](https://github.com/AUTOMATIC1111/stable-diffusion-webui).

## Setup

You need to have AUTOMATIC1111 running with the `--api` flag enabled. Start your AUTOMATIC1111 instance with:

```bash
# Windows
./webui.bat --api

# Linux/Mac
./webui.sh --api
```

The Automatic1111 provider is available in the `automatic1111-provider` module. You can install it with:

```bash
# pnpm
pnpm add automatic1111-provider

# npm
npm install automatic1111-provider

# yarn
npm install automatic1111-provider
```

## Provider Instance

To create an Automatic1111 provider instance, use the `createAutomatic1111` function:

```typescript
import { createAutomatic1111 } from 'automatic1111-provider';

const automatic1111 = createAutomatic1111({
  baseURL: 'http://127.0.0.1:7860', // Your AUTOMATIC1111 instance
});
```

## Image Models

The Automatic1111 provider supports image generation through the `image()` method:

```typescript
// Basic image generation
const imageModel = automatic1111.image('v1-5-pruned-emaonly');

// With custom model
const sdxlModel = automatic1111.image('sd_xl_base_1.0');
```

## Examples

### Basic Image Generation

```typescript
import { automatic1111 } from 'automatic1111-provider';
import { experimental_generateImage as generateImage } from 'ai';

const { images } = await generateImage({
  model: automatic1111.image('v1-5-pruned-emaonly'),
  prompt: 'A beautiful sunset over mountains',
  size: '512x512',
});
```

### Advanced Configuration

```typescript
const { images } = await generateImage({
  model: automatic1111.image('realistic-vision-v4'),
  prompt: 'Portrait of a wise old wizard with a long beard',
  n: 2,
  seed: 12345,
  providerOptions: {
    automatic1111: {
      negative_prompt: 'blurry, ugly, deformed, low quality',
      steps: 40,
      cfg_scale: 8.5,
      sampler_name: 'DPM++ SDE Karras',
      styles: ['photorealistic', 'detailed'],
      check_model_exists: true,
    },
  },
});
```

## Provider Options

The Automatic1111 provider supports the following options for customizing image generation:

### Available Options

| Option               | Type       | Default     | Description                              |
| -------------------- | ---------- | ----------- | ---------------------------------------- |
| `negative_prompt`    | `string`   | `undefined` | What you don't want in the image         |
| `steps`              | `number`   | `20`        | Number of sampling steps                 |
| `cfg_scale`          | `number`   | `7`         | CFG (Classifier Free Guidance) scale     |
| `sampler_name`       | `string`   | `"Euler a"` | Sampling method                          |
| `denoising_strength` | `number`   | `undefined` | Denoising strength for img2img (0.0-1.0) |
| `styles`             | `string[]` | `undefined` | Apply predefined styles                  |
| `check_model_exists` | `boolean`  | `false`     | Verify model exists before generation    |

## Model Management

The provider automatically detects available models from your AUTOMATIC1111 instance. To use a model:

1. Place your `.safetensors` or `.ckpt` model files in the `models/Stable-diffusion/` folder
2. Restart AUTOMATIC1111 or refresh the models list in the web interface
3. Use the exact model name (without file extension) in the provider

## Additional Resources

- [AUTOMATIC1111 Documentation](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- [AUTOMATIC1111 Models](https://civitai.com/models)
- [AUTOMATIC1111 HuggingFace](https://huggingface.co/models?other=automatic1111)
- [Vercel AI SDK](https://ai-sdk.dev/)

# AI/ML API Provider

The [AI/ML API](https://aimlapi.com/?utm_source=aimlapi-vercel-ai&utm_medium=github&utm_campaign=integration) provider gives access to more than 300 AI models over an OpenAI-compatible API.

## Setup

The AI/ML API provider is available via the `@ai-ml.api/aimlapi-vercel-ai` module. You can install it with:

<Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
  <Tab>
    <Snippet text="pnpm add @ai-ml.api/aimlapi-vercel-ai" dark />
  </Tab>
  <Tab>
    <Snippet text="npm install @ai-ml.api/aimlapi-vercel-ai" dark />
  </Tab>
  <Tab>
    <Snippet text="yarn add @ai-ml.api/aimlapi-vercel-ai" dark />
  </Tab>
  <Tab>
    <Snippet text="bun add @ai-ml.api/aimlapi-vercel-ai" dark />
  </Tab>
</Tabs>

### API Key

Set the `AIMLAPI_API_KEY` environment variable with your key:

```bash
export AIMLAPI_API_KEY="sk-..."
```

## Provider Instance

You can import the default provider instance `aimlapi`:

```ts
import { aimlapi } from '@ai-ml.api/aimlapi-vercel-ai';
```

## Language Models

Create models for text generation with `aimlapi` and use them with `generateText`:

```ts
import { aimlapi } from '@ai-ml.api/aimlapi-vercel-ai';
import { generateText } from 'ai';

const { text } = await generateText({
  model: aimlapi('gpt-4o'),
  system: 'You are a friendly assistant!',
  prompt: 'Why is the sky blue?',
});
```

## Image Generation

You can generate images by calling `doGenerate` on an image model:

```ts
import { aimlapi } from '@ai-ml.api/aimlapi-vercel-ai';

const model = aimlapi.imageModel('flux-pro');

const res = await model.doGenerate({
  prompt: 'a red balloon floating over snowy mountains, cinematic',
  n: 1,
  aspectRatio: '16:9',
  seed: 42,
  size: '1024x768',
  providerOptions: {},
});

console.log(`✅ Generated image url: ${res.images[0]}`);
```

## Embeddings

AI/ML API also supports embedding models:

```ts
import { aimlapi } from '@ai-ml.api/aimlapi-vercel-ai';
import { embed } from 'ai';

const { embedding } = await embed({
  model: aimlapi.textEmbeddingModel('text-embedding-3-large'),
  value: 'sunny day at the beach',
});
```

For more information and a full model list, visit the [AI/ML API dashboard](https://aimlapi.com/app?utm_source=aimlapi-vercel-ai&utm_medium=github&utm_campaign=integration) and the [AI/ML API documentation](https://docs.aimlapi.com/?utm_source=aimlapi-vercel-ai&utm_medium=github&utm_campaign=integration).

# Luma Provider

[Luma AI](https://lumalabs.ai/) provides state-of-the-art image generation models through their Dream Machine platform. Their models offer ultra-high quality image generation with superior prompt understanding and unique capabilities like character consistency and multi-image reference support.

## Setup

The Luma provider is available via the `@ai-sdk/luma` module. You can install it with

<Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
  <Tab>
    <Snippet text="pnpm add @ai-sdk/luma" dark />
  </Tab>
  <Tab>
    <Snippet text="npm install @ai-sdk/luma" dark />
  </Tab>
  <Tab>
    <Snippet text="yarn add @ai-sdk/luma" dark />
  </Tab>

  <Tab>
    <Snippet text="bun add @ai-sdk/luma" dark />
  </Tab>
</Tabs>

## Provider Instance

You can import the default provider instance `luma` from `@ai-sdk/luma`:

```ts
import { luma } from '@ai-sdk/luma';
```

If you need a customized setup, you can import `createLuma` and create a provider instance with your settings:

```ts
import { createLuma } from '@ai-sdk/luma';

const luma = createLuma({
  apiKey: 'your-api-key', // optional, defaults to LUMA_API_KEY environment variable
  baseURL: 'custom-url', // optional
  headers: {
    /* custom headers */
  }, // optional
});
```

You can use the following optional settings to customize the Luma provider instance:

- **baseURL** _string_

  Use a different URL prefix for API calls, e.g. to use proxy servers.
  The default prefix is `https://api.lumalabs.ai`.

- **apiKey** _string_

  API key that is being sent using the `Authorization` header.
  It defaults to the `LUMA_API_KEY` environment variable.

- **headers** _Record&lt;string,string&gt;_

  Custom headers to include in the requests.

- **fetch** _(input: RequestInfo, init?: RequestInit) => Promise&lt;Response&gt;_

  Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation.
  You can use it as a middleware to intercept requests,
  or to provide a custom fetch implementation for e.g. testing.

## Image Models

You can create Luma image models using the `.image()` factory method.
For more on image generation with the AI SDK see [generateImage()](/docs/reference/ai-sdk-core/generate-image).

### Basic Usage

```ts
import { luma } from '@ai-sdk/luma';
import { experimental_generateImage as generateImage } from 'ai';
import fs from 'fs';

const { image } = await generateImage({
  model: luma.image('photon-1'),
  prompt: 'A serene mountain landscape at sunset',
  aspectRatio: '16:9',
});

const filename = `image-${Date.now()}.png`;
fs.writeFileSync(filename, image.uint8Array);
console.log(`Image saved to ${filename}`);
```

### Image Model Settings

You can customize the generation behavior with optional settings:

```ts
const { image } = await generateImage({
  model: luma.image('photon-1'),
  prompt: 'A serene mountain landscape at sunset',
  aspectRatio: '16:9',
  maxImagesPerCall: 1, // Maximum number of images to generate per API call
  providerOptions: {
    luma: {
      pollIntervalMillis: 5000, // How often to check for completed images (in ms)
      maxPollAttempts: 10, // Maximum number of polling attempts before timeout
    },
  },
});
```

Since Luma processes images through an asynchronous queue system, these settings allow you to tune the polling behavior:

- **maxImagesPerCall** _number_

  Override the maximum number of images generated per API call. Defaults to 1.

- **pollIntervalMillis** _number_

  Control how frequently the API is checked for completed images while they are
  being processed. Defaults to 500ms.

- **maxPollAttempts** _number_

  Limit how long to wait for results before timing out, since image generation
  is queued asynchronously. Defaults to 120 attempts.

### Model Capabilities

Luma offers two main models:

| Model            | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| `photon-1`       | High-quality image generation with superior prompt understanding |
| `photon-flash-1` | Faster generation optimized for speed while maintaining quality  |

Both models support the following aspect ratios:

- 1:1
- 3:4
- 4:3
- 9:16
- 16:9 (default)
- 9:21
- 21:9

For more details about supported aspect ratios, see the [Luma Image Generation documentation](https://docs.lumalabs.ai/docs/image-generation).

Key features of Luma models include:

- Ultra-high quality image generation
- 10x higher cost efficiency compared to similar models
- Superior prompt understanding and adherence
- Unique character consistency capabilities from single reference images
- Multi-image reference support for precise style matching

### Advanced Options

Luma models support several advanced features through the `providerOptions.luma` parameter.

#### Image Reference

Use up to 4 reference images to guide your generation. Useful for creating variations or visualizing complex concepts. Adjust the `weight` (0-1) to control the influence of reference images.

```ts
// Example: Generate a salamander with reference
await generateImage({
  model: luma.image('photon-1'),
  prompt: 'A salamander at dusk in a forest pond, in the style of ukiyo-e',
  providerOptions: {
    luma: {
      image_ref: [
        {
          url: 'https://example.com/reference.jpg',
          weight: 0.85,
        },
      ],
    },
  },
});
```

#### Style Reference

Apply specific visual styles to your generations using reference images. Control the style influence using the `weight` parameter.

```ts
// Example: Generate with style reference
await generateImage({
  model: luma.image('photon-1'),
  prompt: 'A blue cream Persian cat launching its website on Vercel',
  providerOptions: {
    luma: {
      style_ref: [
        {
          url: 'https://example.com/style.jpg',
          weight: 0.8,
        },
      ],
    },
  },
});
```

#### Character Reference

Create consistent and personalized characters using up to 4 reference images of the same subject. More reference images improve character representation.

```ts
// Example: Generate character-based image
await generateImage({
  model: luma.image('photon-1'),
  prompt: 'A woman with a cat riding a broomstick in a forest',
  providerOptions: {
    luma: {
      character_ref: {
        identity0: {
          images: ['https://example.com/character.jpg'],
        },
      },
    },
  },
});
```

#### Modify Image

Transform existing images using text prompts. Use the `weight` parameter to control how closely the result matches the input image (higher weight = closer to input but less creative).

<Note>
  For color changes, it's recommended to use a lower weight value (0.0-0.1).
</Note>

```ts
// Example: Modify existing image
await generateImage({
  model: luma.image('photon-1'),
  prompt: 'transform the bike to a boat',
  providerOptions: {
    luma: {
      modify_image_ref: {
        url: 'https://example.com/image.jpg',
        weight: 1.0,
      },
    },
  },
});
```

For more details about Luma's capabilities and features, visit the [Luma Image Generation documentation](https://docs.lumalabs.ai/docs/image-generation).

# Fal Provider

[Fal AI](https://fal.ai/) provides a generative media platform for developers with lightning-fast inference capabilities. Their platform offers optimized performance for running diffusion models, with speeds up to 4x faster than alternatives.

## Setup

The Fal provider is available via the `@ai-sdk/fal` module. You can install it with

<Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
  <Tab>
    <Snippet text="pnpm add @ai-sdk/fal" dark />
  </Tab>
  <Tab>
    <Snippet text="npm install @ai-sdk/fal" dark />
  </Tab>
  <Tab>
    <Snippet text="yarn add @ai-sdk/fal" dark />
  </Tab>

  <Tab>
    <Snippet text="bun add @ai-sdk/fal" dark />
  </Tab>
</Tabs>

## Provider Instance

You can import the default provider instance `fal` from `@ai-sdk/fal`:

```ts
import { fal } from '@ai-sdk/fal';
```

If you need a customized setup, you can import `createFal` and create a provider instance with your settings:

```ts
import { createFal } from '@ai-sdk/fal';

const fal = createFal({
  apiKey: 'your-api-key', // optional, defaults to FAL_API_KEY environment variable, falling back to FAL_KEY
  baseURL: 'custom-url', // optional
  headers: {
    /* custom headers */
  }, // optional
});
```

You can use the following optional settings to customize the Fal provider instance:

- **baseURL** _string_

  Use a different URL prefix for API calls, e.g. to use proxy servers.
  The default prefix is `https://fal.run`.

- **apiKey** _string_

  API key that is being sent using the `Authorization` header.
  It defaults to the `FAL_API_KEY` environment variable, falling back to `FAL_KEY`.

- **headers** _Record&lt;string,string&gt;_

  Custom headers to include in the requests.

- **fetch** _(input: RequestInfo, init?: RequestInit) => Promise&lt;Response&gt;_

  Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation.
  You can use it as a middleware to intercept requests,
  or to provide a custom fetch implementation for e.g. testing.

## Image Models

You can create Fal image models using the `.image()` factory method.
For more on image generation with the AI SDK see [generateImage()](/docs/reference/ai-sdk-core/generate-image).

### Basic Usage

```ts
import { fal } from '@ai-sdk/fal';
import { experimental_generateImage as generateImage } from 'ai';
import fs from 'fs';

const { image, providerMetadata } = await generateImage({
  model: fal.image('fal-ai/flux/dev'),
  prompt: 'A serene mountain landscape at sunset',
});

const filename = `image-${Date.now()}.png`;
fs.writeFileSync(filename, image.uint8Array);
console.log(`Image saved to ${filename}`);
```

Fal image models may return additional information for the images and the request.

Here are some examples of properties that may be set for each image

```js
providerMetadata.fal.images[0].nsfw; // boolean, image is not safe for work
providerMetadata.fal.images[0].width; // number, image width
providerMetadata.fal.images[0].height; // number, image height
providerMetadata.fal.images[0].content_type; // string, mime type of the image
```

### Model Capabilities

Fal offers many models optimized for different use cases. Here are a few popular examples. For a full list of models, see the [Fal AI Search Page](https://fal.ai/explore/search).

| Model                                          | Description                                                                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `fal-ai/flux/dev`                              | FLUX.1 [dev] model for high-quality image generation                                                                              |
| `fal-ai/flux-pro/kontext`                      | FLUX.1 Kontext [pro] handles both text and reference images as inputs, enabling targeted edits and complex transformations        |
| `fal-ai/flux-pro/kontext/max`                  | FLUX.1 Kontext [max] with improved prompt adherence and typography generation                                                     |
| `fal-ai/flux-lora`                             | Super fast endpoint for FLUX.1 with LoRA support                                                                                  |
| `fal-ai/ideogram/character`                    | Generate consistent character appearances across multiple images. Maintain facial features, proportions, and distinctive traits   |
| `fal-ai/qwen-image`                            | Qwen-Image foundation model with significant advances in complex text rendering and precise image editing                         |
| `fal-ai/omnigen-v2`                            | Unified image generation model for Image Editing, Personalized Image Generation, Virtual Try-On, Multi Person Generation and more |
| `fal-ai/bytedance/dreamina/v3.1/text-to-image` | Dreamina showcases superior picture effects with improvements in aesthetics, precise and diverse styles, and rich details         |
| `fal-ai/recraft/v3/text-to-image`              | SOTA in image generation with vector art and brand style capabilities                                                             |
| `fal-ai/wan/v2.2-a14b/text-to-image`           | High-resolution, photorealistic images with fine-grained detail                                                                   |

Fal models support the following aspect ratios:

- 1:1 (square HD)
- 16:9 (landscape)
- 9:16 (portrait)
- 4:3 (landscape)
- 3:4 (portrait)
- 16:10 (1280x800)
- 10:16 (800x1280)
- 21:9 (2560x1080)
- 9:21 (1080x2560)

Key features of Fal models include:

- Up to 4x faster inference speeds compared to alternatives
- Optimized by the Fal Inference Engine™
- Support for real-time infrastructure
- Cost-effective scaling with pay-per-use pricing
- LoRA training capabilities for model personalization

#### Modify Image

Transform existing images using text prompts.

```ts
// Example: Modify existing image
await generateImage({
  model: fal.image('fal-ai/flux-pro/kontext'),
  prompt: 'Put a donut next to the flour.',
  providerOptions: {
    fal: {
      image_url:
        'https://v3.fal.media/files/rabbit/rmgBxhwGYb2d3pl3x9sKf_output.png',
    },
  },
});
```

### Provider Options

Fal image models support flexible provider options through the `providerOptions.fal` object. You can pass any parameters supported by the specific Fal model's API. Common options include:

- **image_url** - Reference image URL for image-to-image generation
- **strength** - Controls how much the output differs from the input image
- **guidance_scale** - Controls adherence to the prompt
- **num_inference_steps** - Number of denoising steps
- **safety_checker** - Enable/disable safety filtering

Refer to the [Fal AI model documentation](https://fal.ai/models) for model-specific parameters.

### Advanced Features

Fal's platform offers several advanced capabilities:

- **Private Model Inference**: Run your own diffusion transformer models with up to 50% faster inference
- **LoRA Training**: Train and personalize models in under 5 minutes
- **Real-time Infrastructure**: Enable new user experiences with fast inference times
- **Scalable Architecture**: Scale to thousands of GPUs when needed

For more details about Fal's capabilities and features, visit the [Fal AI documentation](https://fal.ai/docs).

## Transcription Models

You can create models that call the [Fal transcription API](https://docs.fal.ai/guides/convert-speech-to-text)
using the `.transcription()` factory method.

The first argument is the model id without the `fal-ai/` prefix e.g. `wizper`.

```ts
const model = fal.transcription('wizper');
```

You can also pass additional provider-specific options using the `providerOptions` argument. For example, supplying the `batchSize` option will increase the number of audio chunks processed in parallel.

```ts highlight="6"
import { experimental_transcribe as transcribe } from 'ai';
import { fal } from '@ai-sdk/fal';
import { readFile } from 'fs/promises';

const result = await transcribe({
  model: fal.transcription('wizper'),
  audio: await readFile('audio.mp3'),
  providerOptions: { fal: { batchSize: 10 } },
});
```

The following provider options are available:

- **language** _string_
  Language of the audio file. If set to null, the language will be automatically detected.
  Accepts ISO language codes like 'en', 'fr', 'zh', etc.
  Optional.

- **diarize** _boolean_
  Whether to diarize the audio file (identify different speakers).
  Defaults to true.
  Optional.

- **chunkLevel** _string_
  Level of the chunks to return. Either 'segment' or 'word'.
  Default value: "segment"
  Optional.

- **version** _string_
  Version of the model to use. All models are Whisper large variants.
  Default value: "3"
  Optional.

- **batchSize** _number_
  Batch size for processing.
  Default value: 64
  Optional.

- **numSpeakers** _number_
  Number of speakers in the audio file. If not provided, the number of speakers will be automatically detected.
  Optional.

### Model Capabilities

| Model     | Transcription       | Duration            | Segments            | Language            |
| --------- | ------------------- | ------------------- | ------------------- | ------------------- |
| `whisper` | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `wizper`  | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |

## Speech Models

You can create models that call Fal text-to-speech endpoints using the `.speech()` factory method.

### Basic Usage

```ts
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { fal } from '@ai-sdk/fal';

const result = await generateSpeech({
  model: fal.speech('fal-ai/minimax/speech-02-hd'),
  text: 'Hello from the AI SDK!',
});
```

### Model Capabilities

| Model                                     | Description                                                                                                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fal-ai/minimax/voice-clone`              | Clone a voice from a sample audio and generate speech from text prompts                                                                                               |
| `fal-ai/minimax/voice-design`             | Design a personalized voice from a text description and generate speech from text prompts                                                                             |
| `fal-ai/dia-tts/voice-clone`              | Clone dialog voices from a sample audio and generate dialogs from text prompts                                                                                        |
| `fal-ai/minimax/speech-02-hd`             | Generate speech from text prompts and different voices                                                                                                                |
| `fal-ai/minimax/speech-02-turbo`          | Generate fast speech from text prompts and different voices                                                                                                           |
| `fal-ai/dia-tts`                          | Directly generates realistic dialogue from transcripts with audio conditioning for emotion control. Produces natural nonverbals like laughter and throat clearing     |
| `resemble-ai/chatterboxhd/text-to-speech` | Generate expressive, natural speech with Resemble AI's Chatterbox. Features unique emotion control, instant voice cloning from short audio, and built-in watermarking |

### Provider Options

Pass provider-specific options via `providerOptions.fal` depending on the model:

- **voice_setting** _object_

  - `voice_id` (string): predefined voice ID
  - `speed` (number): 0.5–2.0
  - `vol` (number): 0–10
  - `pitch` (number): -12–12
  - `emotion` (enum): happy | sad | angry | fearful | disgusted | surprised | neutral
  - `english_normalization` (boolean)

- **audio_setting** _object_
  Audio configuration settings specific to the model.

- **language_boost** _enum_
  Chinese | Chinese,Yue | English | Arabic | Russian | Spanish | French | Portuguese | German | Turkish | Dutch | Ukrainian | Vietnamese | Indonesian | Japanese | Italian | Korean | Thai | Polish | Romanian | Greek | Czech | Finnish | Hindi | auto

- **pronunciation_dict** _object_
  Custom pronunciation dictionary for specific words.

Model-specific parameters (e.g., `audio_url`, `prompt`, `preview_text`, `ref_audio_url`, `ref_text`) can be passed directly under `providerOptions.fal` and will be forwarded to the Fal API.

# OpenAI Provider

The [OpenAI](https://openai.com/) provider contains language model support for the OpenAI responses, chat, and completion APIs, as well as embedding model support for the OpenAI embeddings API.

## Setup

The OpenAI provider is available in the `@ai-sdk/openai` module. You can install it with

<Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
  <Tab>
    <Snippet text="pnpm add @ai-sdk/openai" dark />
  </Tab>
  <Tab>
    <Snippet text="npm install @ai-sdk/openai" dark />
  </Tab>
  <Tab>
    <Snippet text="yarn add @ai-sdk/openai" dark />
  </Tab>

  <Tab>
    <Snippet text="bun add @ai-sdk/openai" dark />
  </Tab>
</Tabs>

## Provider Instance

You can import the default provider instance `openai` from `@ai-sdk/openai`:

```ts
import { openai } from '@ai-sdk/openai';
```

If you need a customized setup, you can import `createOpenAI` from `@ai-sdk/openai` and create a provider instance with your settings:

```ts
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  // custom settings, e.g.
  headers: {
    'header-name': 'header-value',
  },
});
```

You can use the following optional settings to customize the OpenAI provider instance:

- **baseURL** _string_

  Use a different URL prefix for API calls, e.g. to use proxy servers.
  The default prefix is `https://api.openai.com/v1`.

- **apiKey** _string_

  API key that is being sent using the `Authorization` header.
  It defaults to the `OPENAI_API_KEY` environment variable.

- **name** _string_

  The provider name. You can set this when using OpenAI compatible providers
  to change the model provider property. Defaults to `openai`.

- **organization** _string_

  OpenAI Organization.

- **project** _string_

  OpenAI project.

- **headers** _Record&lt;string,string&gt;_

  Custom headers to include in the requests.

- **fetch** _(input: RequestInfo, init?: RequestInit) => Promise&lt;Response&gt;_

  Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation.
  Defaults to the global `fetch` function.
  You can use it as a middleware to intercept requests,
  or to provide a custom fetch implementation for e.g. testing.

## Language Models

The OpenAI provider instance is a function that you can invoke to create a language model:

```ts
const model = openai('gpt-5');
```

It automatically selects the correct API based on the model id.
You can also pass additional settings in the second argument:

```ts
const model = openai('gpt-5', {
  // additional settings
});
```

The available options depend on the API that's automatically chosen for the model (see below).
If you want to explicitly select a specific model API, you can use `.chat` or `.completion`.

### Example

You can use OpenAI language models to generate text with the `generateText` function:

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const { text } = await generateText({
  model: openai('gpt-5'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

OpenAI language models can also be used in the `streamText`, `generateObject`, and `streamObject` functions
(see [AI SDK Core](/docs/ai-sdk-core)).

### Chat Models

You can create models that call the [OpenAI chat API](https://platform.openai.com/docs/api-reference/chat) using the `.chat()` factory method.
The first argument is the model id, e.g. `gpt-4`.
The OpenAI chat models support tool calls and some have multi-modal capabilities.

```ts
const model = openai.chat('gpt-5');
```

OpenAI chat models support also some model specific provider options that are not part of the [standard call settings](/docs/ai-sdk-core/settings).
You can pass them in the `providerOptions` argument:

```ts
const model = openai.chat('gpt-5');

await generateText({
  model,
  providerOptions: {
    openai: {
      logitBias: {
        // optional likelihood for specific tokens
        '50256': -100,
      },
      user: 'test-user', // optional unique user identifier
    },
  },
});
```

The following optional provider options are available for OpenAI chat models:

- **logitBias** _Record&lt;number, number&gt;_

  Modifies the likelihood of specified tokens appearing in the completion.

  Accepts a JSON object that maps tokens (specified by their token ID in
  the GPT tokenizer) to an associated bias value from -100 to 100. You
  can use this tokenizer tool to convert text to token IDs. Mathematically,
  the bias is added to the logits generated by the model prior to sampling.
  The exact effect will vary per model, but values between -1 and 1 should
  decrease or increase likelihood of selection; values like -100 or 100
  should result in a ban or exclusive selection of the relevant token.

  As an example, you can pass `{"50256": -100}` to prevent the token from being generated.

- **logprobs** _boolean | number_

  Return the log probabilities of the tokens. Including logprobs will increase
  the response size and can slow down response times. However, it can
  be useful to better understand how the model is behaving.

  Setting to true will return the log probabilities of the tokens that
  were generated.

  Setting to a number will return the log probabilities of the top n
  tokens that were generated.

- **parallelToolCalls** _boolean_

  Whether to enable parallel function calling during tool use. Defaults to `true`.

- **user** _string_

  A unique identifier representing your end-user, which can help OpenAI to
  monitor and detect abuse. [Learn more](https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids).

- **reasoningEffort** _'minimal' | 'low' | 'medium' | 'high'_

  Reasoning effort for reasoning models. Defaults to `medium`. If you use
  `providerOptions` to set the `reasoningEffort` option, this
  model setting will be ignored.

- **structuredOutputs** _boolean_

  Whether to use [structured outputs](#structured-outputs).
  Defaults to `true`.

  When enabled, tool calls and object generation will be strict and follow the provided schema.

- **maxCompletionTokens** _number_

  Maximum number of completion tokens to generate. Useful for reasoning models.

- **store** _boolean_

  Whether to enable persistence in Responses API.

- **metadata** _Record&lt;string, string&gt;_

  Metadata to associate with the request.

- **prediction** _Record&lt;string, any&gt;_

  Parameters for prediction mode.

- **serviceTier** _'auto' | 'flex'_

  Service tier for the request. Set to 'flex' for 50% cheaper processing
  at the cost of increased latency. Only available for o3, o4-mini, and gpt-5 models.
  Defaults to 'auto'.

- **strictJsonSchema** _boolean_

  Whether to use strict JSON schema validation.
  Defaults to `false`.

- **textVerbosity** _'low' | 'medium' | 'high'_

  Controls the verbosity of the model's responses. Lower values will result in more concise responses, while higher values will result in more verbose responses.

- **promptCacheKey** _string_

  A cache key for manual prompt caching control. Used by OpenAI to cache responses for similar requests to optimize your cache hit rates.

- **safetyIdentifier** _string_

  A stable identifier used to help detect users of your application that may be violating OpenAI's usage policies. The IDs should be a string that uniquely identifies each user.

#### Reasoning

OpenAI has introduced the `o1`,`o3`, and `o4` series of [reasoning models](https://platform.openai.com/docs/guides/reasoning).
Currently, `o4-mini`, `o3`, `o3-mini`, and `o1` are available via both the chat and responses APIs. The
models `codex-mini-latest` and `computer-use-preview` are available only via the [responses API](#responses-models).

Reasoning models currently only generate text, have several limitations, and are only supported using `generateText` and `streamText`.

They support additional settings and response metadata:

- You can use `providerOptions` to set

  - the `reasoningEffort` option (or alternatively the `reasoningEffort` model setting), which determines the amount of reasoning the model performs.

- You can use response `providerMetadata` to access the number of reasoning tokens that the model generated.

```ts highlight="4,7-11,17"
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const { text, usage, providerMetadata } = await generateText({
  model: openai('gpt-5'),
  prompt: 'Invent a new holiday and describe its traditions.',
  providerOptions: {
    openai: {
      reasoningEffort: 'low',
    },
  },
});

console.log(text);
console.log('Usage:', {
  ...usage,
  reasoningTokens: providerMetadata?.openai?.reasoningTokens,
});
```

<Note>
  System messages are automatically converted to OpenAI developer messages for
  reasoning models when supported.
</Note>

<Note>
  Reasoning models require additional runtime inference to complete their
  reasoning phase before generating a response. This introduces longer latency
  compared to other models.
</Note>

<Note>
  `maxOutputTokens` is automatically mapped to `max_completion_tokens` for
  reasoning models.
</Note>

#### Structured Outputs

Structured outputs are enabled by default.
You can disable them by setting the `structuredOutputs` option to `false`.

```ts highlight="7"
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const result = await generateObject({
  model: openai('gpt-4o-2024-08-06'),
  providerOptions: {
    openai: {
      structuredOutputs: false,
    },
  },
  schemaName: 'recipe',
  schemaDescription: 'A recipe for lasagna.',
  schema: z.object({
    name: z.string(),
    ingredients: z.array(
      z.object({
        name: z.string(),
        amount: z.string(),
      }),
    ),
    steps: z.array(z.string()),
  }),
  prompt: 'Generate a lasagna recipe.',
});

console.log(JSON.stringify(result.object, null, 2));
```

<Note type="warning">
  OpenAI structured outputs have several
  [limitations](https://openai.com/index/introducing-structured-outputs-in-the-api),
  in particular around the [supported schemas](https://platform.openai.com/docs/guides/structured-outputs/supported-schemas),
  and are therefore opt-in.

For example, optional schema properties are not supported.
You need to change Zod `.nullish()` and `.optional()` to `.nullable()`.

</Note>

#### Logprobs

OpenAI provides logprobs information for completion/chat models.
You can access it in the `providerMetadata` object.

```ts highlight="11"
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const result = await generateText({
  model: openai('gpt-5'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
  providerOptions: {
    openai: {
      // this can also be a number,
      // refer to logprobs provider options section for more
      logprobs: true,
    },
  },
});

const openaiMetadata = (await result.providerMetadata)?.openai;

const logprobs = openaiMetadata?.logprobs;
```

#### Image Support

The OpenAI Chat API supports Image inputs for appropriate models.
You can pass Image files as part of the message content using the 'image' type:

```ts
const result = await generateText({
  model: openai('gpt-5'),
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Please describe the image.',
        },
        {
          type: 'image',
          image: fs.readFileSync('./data/image.png'),
        },
      ],
    },
  ],
});
```

The model will have access to the image and will respond to questions about it.
The image should be passed using the `image` field.

You can also pass the URL of an image.

```ts
{
  type: 'image',
  image: 'https://sample.edu/image.png',
}
```

#### PDF support

The OpenAI Chat API supports reading PDF files.
You can pass PDF files as part of the message content using the `file` type:

```ts
const result = await generateText({
  model: openai('gpt-5'),
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What is an embedding model?',
        },
        {
          type: 'file',
          data: fs.readFileSync('./data/ai.pdf'),
          mediaType: 'application/pdf',
          filename: 'ai.pdf', // optional
        },
      ],
    },
  ],
});
```

The model will have access to the contents of the PDF file and
respond to questions about it.
The PDF file should be passed using the `data` field,
and the `mediaType` should be set to `'application/pdf'`.

You can also pass a file-id from the OpenAI Files API.

```ts
{
  type: 'file',
  data: 'file-8EFBcWHsQxZV7YGezBC1fq',
  mediaType: 'application/pdf',
}
```

You can also pass the URL of a PDF.

```ts
{
  type: 'file',
  data: 'https://sample.edu/example.pdf',
  mediaType: 'application/pdf',
  filename: 'ai.pdf', // optional
}
```

#### Predicted Outputs

OpenAI supports [predicted outputs](https://platform.openai.com/docs/guides/latency-optimization#use-predicted-outputs) for `gpt-4o` and `gpt-4o-mini`.
Predicted outputs help you reduce latency by allowing you to specify a base text that the model should modify.
You can enable predicted outputs by adding the `prediction` option to the `providerOptions.openai` object:

```ts highlight="15-18"
const result = streamText({
  model: openai('gpt-5'),
  messages: [
    {
      role: 'user',
      content: 'Replace the Username property with an Email property.',
    },
    {
      role: 'user',
      content: existingCode,
    },
  ],
  providerOptions: {
    openai: {
      prediction: {
        type: 'content',
        content: existingCode,
      },
    },
  },
});
```

OpenAI provides usage information for predicted outputs (`acceptedPredictionTokens` and `rejectedPredictionTokens`).
You can access it in the `providerMetadata` object.

```ts highlight="11"
const openaiMetadata = (await result.providerMetadata)?.openai;

const acceptedPredictionTokens = openaiMetadata?.acceptedPredictionTokens;
const rejectedPredictionTokens = openaiMetadata?.rejectedPredictionTokens;
```

<Note type="warning">
  OpenAI Predicted Outputs have several
  [limitations](https://platform.openai.com/docs/guides/predicted-outputs#limitations),
  e.g. unsupported API parameters and no tool calling support.
</Note>

#### Image Detail

You can use the `openai` provider option to set the [image input detail](https://platform.openai.com/docs/guides/images-vision?api-mode=responses#specify-image-input-detail-level) to `high`, `low`, or `auto`:

```ts highlight="13-16"
const result = await generateText({
  model: openai('gpt-5'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe the image in detail.' },
        {
          type: 'image',
          image:
            'https://github.com/vercel/ai/blob/main/examples/ai-core/data/comic-cat.png?raw=true',

          // OpenAI specific options - image detail:
          providerOptions: {
            openai: { imageDetail: 'low' },
          },
        },
      ],
    },
  ],
});
```

<Note type="warning">
  Because the `UIMessage` type (used by AI SDK UI hooks like `useChat`) does not
  support the `providerOptions` property, you can use `convertToModelMessages`
  first before passing the messages to functions like `generateText` or
  `streamText`. For more details on `providerOptions` usage, see
  [here](/docs/foundations/prompts#provider-options).
</Note>

#### Distillation

OpenAI supports model distillation for some models.
If you want to store a generation for use in the distillation process, you can add the `store` option to the `providerOptions.openai` object.
This will save the generation to the OpenAI platform for later use in distillation.

```typescript highlight="9-16"
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import 'dotenv/config';

async function main() {
  const { text, usage } = await generateText({
    model: openai('gpt-4o-mini'),
    prompt: 'Who worked on the original macintosh?',
    providerOptions: {
      openai: {
        store: true,
        metadata: {
          custom: 'value',
        },
      },
    },
  });

  console.log(text);
  console.log();
  console.log('Usage:', usage);
}

main().catch(console.error);
```

#### Prompt Caching

OpenAI has introduced [Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) for supported models
including `gpt-4o` and `gpt-4o-mini`.

- Prompt caching is automatically enabled for these models, when the prompt is 1024 tokens or longer. It does
  not need to be explicitly enabled.
- You can use response `providerMetadata` to access the number of prompt tokens that were a cache hit.
- Note that caching behavior is dependent on load on OpenAI's infrastructure. Prompt prefixes generally remain in the
  cache following 5-10 minutes of inactivity before they are evicted, but during off-peak periods they may persist for up
  to an hour.

```ts highlight="11"
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const { text, usage, providerMetadata } = await generateText({
  model: openai('gpt-4o-mini'),
  prompt: `A 1024-token or longer prompt...`,
});

console.log(`usage:`, {
  ...usage,
  cachedPromptTokens: providerMetadata?.openai?.cachedPromptTokens,
});
```

To improve cache hit rates, you can manually control caching using the `promptCacheKey` option:

```ts highlight="7-11"
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const { text, usage, providerMetadata } = await generateText({
  model: openai('gpt-5'),
  prompt: `A 1024-token or longer prompt...`,
  providerOptions: {
    openai: {
      promptCacheKey: 'my-custom-cache-key-123',
    },
  },
});

console.log(`usage:`, {
  ...usage,
  cachedPromptTokens: providerMetadata?.openai?.cachedPromptTokens,
});
```

#### Audio Input

With the `gpt-4o-audio-preview` model, you can pass audio files to the model.

<Note type="warning">
  The `gpt-4o-audio-preview` model is currently in preview and requires at least
  some audio inputs. It will not work with non-audio data.
</Note>

```ts highlight="12-14"
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const result = await generateText({
  model: openai('gpt-4o-audio-preview'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is the audio saying?' },
        {
          type: 'file',
          mediaType: 'audio/mpeg',
          data: fs.readFileSync('./data/galileo.mp3'),
        },
      ],
    },
  ],
});
```

### Responses Models

You can use the OpenAI responses API with the `openai.responses(modelId)` factory method.

```ts
const model = openai.responses('gpt-5');
```

Further configuration can be done using OpenAI provider options.
You can validate the provider options using the `OpenAIResponsesProviderOptions` type.

```ts
import { openai, OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { generateText } from 'ai';

const result = await generateText({
  model: openai.responses('gpt-5'),
  providerOptions: {
    openai: {
      parallelToolCalls: false,
      store: false,
      user: 'user_123',
      // ...
    } satisfies OpenAIResponsesProviderOptions,
  },
  // ...
});
```

The following provider options are available:

- **parallelToolCalls** _boolean_
  Whether to use parallel tool calls. Defaults to `true`.

- **store** _boolean_

  Whether to store the generation. Defaults to `true`.

  When using reasoning models (o1, o3, o4-mini) with multi-step tool calls and `store: false`,
  include `['reasoning.encrypted_content']` in the `include` option to ensure reasoning
  content is available across conversation steps.

- **metadata** _Record&lt;string, string&gt;_
  Additional metadata to store with the generation.

- **previousResponseId** _string_
  The ID of the previous response. You can use it to continue a conversation. Defaults to `undefined`.

- **instructions** _string_
  Instructions for the model.
  They can be used to change the system or developer message when continuing a conversation using the `previousResponseId` option.
  Defaults to `undefined`.

- **user** _string_
  A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. Defaults to `undefined`.

- **reasoningEffort** _'minimal' | 'low' | 'medium' | 'high'_
  Reasoning effort for reasoning models. Defaults to `medium`. If you use `providerOptions` to set the `reasoningEffort` option, this model setting will be ignored.

- **reasoningSummary** _'auto' | 'detailed'_
  Controls whether the model returns its reasoning process. Set to `'auto'` for a condensed summary, `'detailed'` for more comprehensive reasoning. Defaults to `undefined` (no reasoning summaries). When enabled, reasoning summaries appear in the stream as events with type `'reasoning'` and in non-streaming responses within the `reasoning` field.

- **strictJsonSchema** _boolean_
  Whether to use strict JSON schema validation. Defaults to `false`.

- **serviceTier** _'auto' | 'flex' | 'priority'_
  Service tier for the request. Set to 'flex' for 50% cheaper processing
  at the cost of increased latency (available for o3, o4-mini, and gpt-5 models).
  Set to 'priority' for faster processing with Enterprise access (available for gpt-4, gpt-5, gpt-5-mini, o3, o4-mini; gpt-5-nano is not supported).
  Defaults to 'auto'.

- **textVerbosity** _'low' | 'medium' | 'high'_
  Controls the verbosity of the model's response. Lower values result in more concise responses,
  while higher values result in more verbose responses. Defaults to `'medium'`.

- **include** _Array&lt;string&gt;_
  Specifies additional content to include in the response. Supported values:
  `['reasoning.encrypted_content']` for accessing reasoning content across conversation steps,
  and `['file_search_call.results']` for including file search results in responses.
  Defaults to `undefined`.

- **promptCacheKey** _string_
  A cache key for manual prompt caching control. Used by OpenAI to cache responses for similar requests to optimize your cache hit rates.

- **safetyIdentifier** \_string_0
  A stable identifier used to help detect users of your application that may be violating OpenAI's usage policies. The IDs should be a string that uniquely identifies each user.

The OpenAI responses provider also returns provider-specific metadata:

```ts
const { providerMetadata } = await generateText({
  model: openai.responses('gpt-5'),
});

const openaiMetadata = providerMetadata?.openai;
```

The following OpenAI-specific metadata is returned:

- **responseId** _string_
  The ID of the response. Can be used to continue a conversation.

- **cachedPromptTokens** _number_
  The number of prompt tokens that were a cache hit.

- **reasoningTokens** _number_
  The number of reasoning tokens that the model generated.

#### Web Search

The OpenAI responses API supports web search through the `openai.tools.webSearchPreview` tool.

You can force the use of the web search tool by setting the `toolChoice` parameter to `{ type: 'tool', toolName: 'web_search_preview' }`.

```ts
const result = await generateText({
  model: openai.responses('gpt-5'),
  prompt: 'What happened in San Francisco last week?',
  tools: {
    web_search_preview: openai.tools.webSearchPreview({
      // optional configuration:
      searchContextSize: 'high',
      userLocation: {
        type: 'approximate',
        city: 'San Francisco',
        region: 'California',
      },
    }),
  },
  // Force web search tool:
  toolChoice: { type: 'tool', toolName: 'web_search_preview' },
});

// URL sources
const sources = result.sources;
```

#### Reasoning Output

For reasoning models like `gpt-5`, you can enable reasoning summaries to see the model's thought process. Different models support different summarizers—for example, `o4-mini` supports detailed summaries. Set `reasoningSummary: "auto"` to automatically receive the richest level available.

```ts highlight="8-9,16"
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

const result = streamText({
  model: openai.responses('gpt-5'),
  prompt: 'Tell me about the Mission burrito debate in San Francisco.',
  providerOptions: {
    openai: {
      reasoningSummary: 'detailed', // 'auto' for condensed or 'detailed' for comprehensive
    },
  },
});

for await (const part of result.fullStream) {
  if (part.type === 'reasoning') {
    console.log(`Reasoning: ${part.textDelta}`);
  } else if (part.type === 'text-delta') {
    process.stdout.write(part.textDelta);
  }
}
```

For non-streaming calls with `generateText`, the reasoning summaries are available in the `reasoning` field of the response:

```ts highlight="8-9,13"
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const result = await generateText({
  model: openai.responses('gpt-5'),
  prompt: 'Tell me about the Mission burrito debate in San Francisco.',
  providerOptions: {
    openai: {
      reasoningSummary: 'auto',
    },
  },
});
console.log('Reasoning:', result.reasoning);
```

Learn more about reasoning summaries in the [OpenAI documentation](https://platform.openai.com/docs/guides/reasoning?api-mode=responses#reasoning-summaries).

#### Verbosity Control

You can control the length and detail of model responses using the `textVerbosity` parameter:

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const result = await generateText({
  model: openai.responses('gpt-5-mini'),
  prompt: 'Write a poem about a boy and his first pet dog.',
  providerOptions: {
    openai: {
      textVerbosity: 'low', // 'low' for concise, 'medium' (default), or 'high' for verbose
    },
  },
});
```

The `textVerbosity` parameter scales output length without changing the underlying prompt:

- `'low'`: Produces terse, minimal responses
- `'medium'`: Balanced detail (default)
- `'high'`: Verbose responses with comprehensive detail

#### File Search

The OpenAI responses API supports file search through the `openai.tools.fileSearch` tool.

You can force the use of the file search tool by setting the `toolChoice` parameter to `{ type: 'tool', toolName: 'file_search' }`.

```ts
const result = await generateText({
  model: openai.responses('gpt-5'),
  prompt: 'What does the document say about user authentication?',
  tools: {
    file_search: openai.tools.fileSearch({
      // optional configuration:
      vectorStoreIds: ['vs_123', 'vs_456'],
      maxNumResults: 10,
      ranking: {
        ranker: 'auto',
      },
      filters: {
        type: 'and',
        filters: [
          { key: 'author', type: 'eq', value: 'John Doe' },
          { key: 'date', type: 'gte', value: '2023-01-01' },
        ],
      },
    }),
  },
  // Force file search tool:
  toolChoice: { type: 'tool', toolName: 'file_search' },
});
```

<Note>
  The tool must be named `file_search` when using OpenAI's file search
  functionality. This name is required by OpenAI's API specification and cannot
  be customized.
</Note>

#### Code Interpreter

The OpenAI responses API supports the code interpreter tool through the `openai.tools.codeInterpreter` tool. This allows models to write and execute Python code.

```ts
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const result = await generateText({
  model: openai.responses('gpt-5'),
  prompt: 'Write and run Python code to calculate the factorial of 10',
  tools: {
    code_interpreter: openai.tools.codeInterpreter({
      // optional configuration:
      container: {
        fileIds: ['file-123', 'file-456'], // optional file IDs to make available
      },
    }),
  },
});
```

The code interpreter tool can be configured with:

- **container**: Either a container ID string or an object with `fileIds` to specify uploaded files that should be available to the code interpreter

<Note>
  The tool must be named `code_interpreter` when using OpenAI's code interpreter
  functionality. This name is required by OpenAI's API specification and cannot
  be customized.
</Note>

#### Image Support

The OpenAI Responses API supports Image inputs for appropriate models.
You can pass Image files as part of the message content using the 'image' type:

```ts
const result = await generateText({
  model: openai.responses('gpt-5'),
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Please describe the image.',
        },
        {
          type: 'image',
          image: fs.readFileSync('./data/image.png'),
        },
      ],
    },
  ],
});
```

The model will have access to the image and will respond to questions about it.
The image should be passed using the `image` field.

You can also pass a file-id from the OpenAI Files API.

```ts
{
  type: 'image',
  image: 'file-8EFBcWHsQxZV7YGezBC1fq'
}
```

You can also pass the URL of an image.

```ts
{
  type: 'image',
  image: 'https://sample.edu/image.png',
}
```

#### PDF support

The OpenAI Responses API supports reading PDF files.
You can pass PDF files as part of the message content using the `file` type:

```ts
const result = await generateText({
  model: openai.responses('gpt-5'),
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What is an embedding model?',
        },
        {
          type: 'file',
          data: fs.readFileSync('./data/ai.pdf'),
          mediaType: 'application/pdf',
          filename: 'ai.pdf', // optional
        },
      ],
    },
  ],
});
```

You can also pass a file-id from the OpenAI Files API.

```ts
{
  type: 'file',
  data: 'file-8EFBcWHsQxZV7YGezBC1fq',
  mediaType: 'application/pdf',
}
```

You can also pass the URL of a pdf.

```ts
{
  type: 'file',
  data: 'https://sample.edu/example.pdf',
  mediaType: 'application/pdf',
  filename: 'ai.pdf', // optional
}
```

The model will have access to the contents of the PDF file and
respond to questions about it.
The PDF file should be passed using the `data` field,
and the `mediaType` should be set to `'application/pdf'`.

#### Structured Outputs

The OpenAI Responses API supports structured outputs. You can enforce structured outputs using `generateObject` or `streamObject`, which expose a `schema` option. Additionally, you can pass a Zod or JSON Schema object to the `experimental_output` option when using `generateText` or `streamText`.

```ts
// Using generateObject
const result = await generateObject({
  model: openai.responses('gpt-4.1'),
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(
        z.object({
          name: z.string(),
          amount: z.string(),
        }),
      ),
      steps: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a lasagna recipe.',
});

// Using generateText
const result = await generateText({
  model: openai.responses('gpt-4.1'),
  prompt: 'How do I make a pizza?',
  experimental_output: Output.object({
    schema: z.object({
      ingredients: z.array(z.string()),
      steps: z.array(z.string()),
    }),
  }),
});
```

### Completion Models

You can create models that call the [OpenAI completions API](https://platform.openai.com/docs/api-reference/completions) using the `.completion()` factory method.
The first argument is the model id.
Currently only `gpt-3.5-turbo-instruct` is supported.

```ts
const model = openai.completion('gpt-3.5-turbo-instruct');
```

OpenAI completion models support also some model specific settings that are not part of the [standard call settings](/docs/ai-sdk-core/settings).
You can pass them as an options argument:

```ts
const model = openai.completion('gpt-3.5-turbo-instruct');

await model.doGenerate({
  providerOptions: {
    openai: {
      echo: true, // optional, echo the prompt in addition to the completion
      logitBias: {
        // optional likelihood for specific tokens
        '50256': -100,
      },
      suffix: 'some text', // optional suffix that comes after a completion of inserted text
      user: 'test-user', // optional unique user identifier
    },
  },
});
```

The following optional provider options are available for OpenAI completion models:

- **echo**: _boolean_

  Echo back the prompt in addition to the completion.

- **logitBias** _Record&lt;number, number&gt;_

  Modifies the likelihood of specified tokens appearing in the completion.

  Accepts a JSON object that maps tokens (specified by their token ID in
  the GPT tokenizer) to an associated bias value from -100 to 100. You
  can use this tokenizer tool to convert text to token IDs. Mathematically,
  the bias is added to the logits generated by the model prior to sampling.
  The exact effect will vary per model, but values between -1 and 1 should
  decrease or increase likelihood of selection; values like -100 or 100
  should result in a ban or exclusive selection of the relevant token.

  As an example, you can pass `{"50256": -100}` to prevent the &lt;|endoftext|&gt;
  token from being generated.

- **logprobs** _boolean | number_

  Return the log probabilities of the tokens. Including logprobs will increase
  the response size and can slow down response times. However, it can
  be useful to better understand how the model is behaving.

  Setting to true will return the log probabilities of the tokens that
  were generated.

  Setting to a number will return the log probabilities of the top n
  tokens that were generated.

- **suffix** _string_

  The suffix that comes after a completion of inserted text.

- **user** _string_

  A unique identifier representing your end-user, which can help OpenAI to
  monitor and detect abuse. [Learn more](https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids).

### Model Capabilities

| Model                  | Image Input         | Audio Input         | Object Generation   | Tool Usage          |
| ---------------------- | ------------------- | ------------------- | ------------------- | ------------------- |
| `gpt-4.1`              | <Check size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gpt-4.1-mini`         | <Check size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gpt-4.1-nano`         | <Check size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gpt-4o`               | <Check size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gpt-4o-mini`          | <Check size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gpt-4o-audio-preview` | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gpt-4-turbo`          | <Check size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gpt-4`                | <Cross size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gpt-3.5-turbo`        | <Cross size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `o1`                   | <Check size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `o3-mini`              | <Cross size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `o3`                   | <Check size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `o4-mini`              | <Check size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `chatgpt-4o-latest`    | <Check size={18} /> | <Cross size={18} /> | <Cross size={18} /> | <Cross size={18} /> |
| `gpt-5`                | <Check size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gpt-5-mini`           | <Check size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gpt-5-nano`           | <Check size={18} /> | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gpt-5-chat-latest`    | <Check size={18} /> | <Cross size={18} /> | <Cross size={18} /> | <Cross size={18} /> |

<Note>
  The table above lists popular models. Please see the [OpenAI
  docs](https://platform.openai.com/docs/models) for a full list of available
  models. The table above lists popular models. You can also pass any available
  provider model ID as a string if needed.
</Note>

## Embedding Models

You can create models that call the [OpenAI embeddings API](https://platform.openai.com/docs/api-reference/embeddings)
using the `.textEmbedding()` factory method.

```ts
const model = openai.textEmbedding('text-embedding-3-large');
```

OpenAI embedding models support several additional provider options.
You can pass them as an options argument:

```ts
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

const { embedding } = await embed({
  model: openai.textEmbedding('text-embedding-3-large'),
  value: 'sunny day at the beach',
  providerOptions: {
    openai: {
      dimensions: 512, // optional, number of dimensions for the embedding
      user: 'test-user', // optional unique user identifier
    },
  },
});
```

The following optional provider options are available for OpenAI embedding models:

- **dimensions**: _number_

  The number of dimensions the resulting output embeddings should have.
  Only supported in text-embedding-3 and later models.

- **user** _string_

  A unique identifier representing your end-user, which can help OpenAI to
  monitor and detect abuse. [Learn more](https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids).

### Model Capabilities

| Model                    | Default Dimensions | Custom Dimensions   |
| ------------------------ | ------------------ | ------------------- |
| `text-embedding-3-large` | 3072               | <Check size={18} /> |
| `text-embedding-3-small` | 1536               | <Check size={18} /> |
| `text-embedding-ada-002` | 1536               | <Cross size={18} /> |

## Image Models

You can create models that call the [OpenAI image generation API](https://platform.openai.com/docs/api-reference/images)
using the `.image()` factory method.

```ts
const model = openai.image('dall-e-3');
```

<Note>
  Dall-E models do not support the `aspectRatio` parameter. Use the `size`
  parameter instead.
</Note>

### Model Capabilities

| Model         | Sizes                           |
| ------------- | ------------------------------- |
| `gpt-image-1` | 1024x1024, 1536x1024, 1024x1536 |
| `dall-e-3`    | 1024x1024, 1792x1024, 1024x1792 |
| `dall-e-2`    | 256x256, 512x512, 1024x1024     |

You can pass optional `providerOptions` to the image model. These are prone to change by OpenAI and are model dependent. For example, the `gpt-image-1` model supports the `quality` option:

```ts
const { image, providerMetadata } = await generateImage({
  model: openai.image('gpt-image-1'),
  prompt: 'A salamander at sunrise in a forest pond in the Seychelles.',
  providerOptions: {
    openai: { quality: 'high' },
  },
});
```

For more on `generateImage()` see [Image Generation](/docs/ai-sdk-core/image-generation).

OpenAI's image models may return a revised prompt for each image. It can be access at `providerMetadata.openai.images[0]?.revisedPrompt`.

For more information on the available OpenAI image model options, see the [OpenAI API reference](https://platform.openai.com/docs/api-reference/images/create).

## Transcription Models

You can create models that call the [OpenAI transcription API](https://platform.openai.com/docs/api-reference/audio/transcribe)
using the `.transcription()` factory method.

The first argument is the model id e.g. `whisper-1`.

```ts
const model = openai.transcription('whisper-1');
```

You can also pass additional provider-specific options using the `providerOptions` argument. For example, supplying the input language in ISO-639-1 (e.g. `en`) format will improve accuracy and latency.

```ts highlight="6"
import { experimental_transcribe as transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await transcribe({
  model: openai.transcription('whisper-1'),
  audio: new Uint8Array([1, 2, 3, 4]),
  providerOptions: { openai: { language: 'en' } },
});
```

To get word-level timestamps, specify the granularity:

```ts highlight="8-9"
import { experimental_transcribe as transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await transcribe({
  model: openai.transcription('whisper-1'),
  audio: new Uint8Array([1, 2, 3, 4]),
  providerOptions: {
    openai: {
      //timestampGranularities: ['word'],
      timestampGranularities: ['segment'],
    },
  },
});

// Access word-level timestamps
console.log(result.segments); // Array of segments with startSecond/endSecond
```

The following provider options are available:

- **timestampGranularities** _string[]_
  The granularity of the timestamps in the transcription.
  Defaults to `['segment']`.
  Possible values are `['word']`, `['segment']`, and `['word', 'segment']`.
  Note: There is no additional latency for segment timestamps, but generating word timestamps incurs additional latency.

- **language** _string_
  The language of the input audio. Supplying the input language in ISO-639-1 format (e.g. 'en') will improve accuracy and latency.
  Optional.

- **prompt** _string_
  An optional text to guide the model's style or continue a previous audio segment. The prompt should match the audio language.
  Optional.

- **temperature** _number_
  The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use log probability to automatically increase the temperature until certain thresholds are hit.
  Defaults to 0.
  Optional.

- **include** _string[]_
  Additional information to include in the transcription response.

### Model Capabilities

| Model                    | Transcription       | Duration            | Segments            | Language            |
| ------------------------ | ------------------- | ------------------- | ------------------- | ------------------- |
| `whisper-1`              | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gpt-4o-mini-transcribe` | <Check size={18} /> | <Cross size={18} /> | <Cross size={18} /> | <Cross size={18} /> |
| `gpt-4o-transcribe`      | <Check size={18} /> | <Cross size={18} /> | <Cross size={18} /> | <Cross size={18} /> |

## Speech Models

You can create models that call the [OpenAI speech API](https://platform.openai.com/docs/api-reference/audio/speech)
using the `.speech()` factory method.

The first argument is the model id e.g. `tts-1`.

```ts
const model = openai.speech('tts-1');
```

You can also pass additional provider-specific options using the `providerOptions` argument. For example, supplying a voice to use for the generated audio.

```ts highlight="6"
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await generateSpeech({
  model: openai.speech('tts-1'),
  text: 'Hello, world!',
  providerOptions: { openai: {} },
});
```

- **instructions** _string_
  Control the voice of your generated audio with additional instructions e.g. "Speak in a slow and steady tone".
  Does not work with `tts-1` or `tts-1-hd`.
  Optional.

- **response_format** _string_
  The format to audio in.
  Supported formats are `mp3`, `opus`, `aac`, `flac`, `wav`, and `pcm`.
  Defaults to `mp3`.
  Optional.

- **speed** _number_
  The speed of the generated audio.
  Select a value from 0.25 to 4.0.
  Defaults to 1.0.
  Optional.

### Model Capabilities

| Model             | Instructions        |
| ----------------- | ------------------- |
| `tts-1`           | <Check size={18} /> |
| `tts-1-hd`        | <Check size={18} /> |
| `gpt-4o-mini-tts` | <Check size={18} /> |

# Google Generative AI Provider

The [Google Generative AI](https://ai.google.dev) provider contains language and embedding model support for
the [Google Generative AI](https://ai.google.dev/api/rest) APIs.

## Setup

The Google provider is available in the `@ai-sdk/google` module. You can install it with

<Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
  <Tab>
    <Snippet text="pnpm add @ai-sdk/google" dark />
  </Tab>
  <Tab>
    <Snippet text="npm install @ai-sdk/google" dark />
  </Tab>
  <Tab>
    <Snippet text="yarn add @ai-sdk/google" dark />
  </Tab>

  <Tab>
    <Snippet text="bun add @ai-sdk/google" dark />
  </Tab>
</Tabs>

## Provider Instance

You can import the default provider instance `google` from `@ai-sdk/google`:

```ts
import { google } from '@ai-sdk/google';
```

If you need a customized setup, you can import `createGoogleGenerativeAI` from `@ai-sdk/google` and create a provider instance with your settings:

```ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  // custom settings
});
```

You can use the following optional settings to customize the Google Generative AI provider instance:

- **baseURL** _string_

  Use a different URL prefix for API calls, e.g. to use proxy servers.
  The default prefix is `https://generativelanguage.googleapis.com/v1beta`.

- **apiKey** _string_

  API key that is being sent using the `x-goog-api-key` header.
  It defaults to the `GOOGLE_GENERATIVE_AI_API_KEY` environment variable.

- **headers** _Record&lt;string,string&gt;_

  Custom headers to include in the requests.

- **fetch** _(input: RequestInfo, init?: RequestInit) => Promise&lt;Response&gt;_

  Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation.
  Defaults to the global `fetch` function.
  You can use it as a middleware to intercept requests,
  or to provide a custom fetch implementation for e.g. testing.

## Language Models

You can create models that call the [Google Generative AI API](https://ai.google.dev/api/rest) using the provider instance.
The first argument is the model id, e.g. `gemini-2.5-flash`.
The models support tool calls and some have multi-modal capabilities.

```ts
const model = google('gemini-2.5-flash');
```

You can use Google Generative AI language models to generate text with the `generateText` function:

```ts
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const { text } = await generateText({
  model: google('gemini-2.5-flash'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

Google Generative AI language models can also be used in the `streamText`, `generateObject`, and `streamObject` functions
(see [AI SDK Core](/docs/ai-sdk-core)).

Google Generative AI also supports some model specific settings that are not part of the [standard call settings](/docs/ai-sdk-core/settings).
You can pass them as an options argument:

```ts
const model = google('gemini-2.5-flash');

await generateText({
  model,
  providerOptions: {
    google: {
      safetySettings: [
        {
          category: 'HARM_CATEGORY_UNSPECIFIED',
          threshold: 'BLOCK_LOW_AND_ABOVE',
        },
      ],
      responseModalities: ['TEXT', 'IMAGE'],
    },
  },
});
```

The following optional provider options are available for Google Generative AI models:

- **cachedContent** _string_

  Optional. The name of the cached content used as context to serve the prediction.
  Format: cachedContents/\{cachedContent\}

- **structuredOutputs** _boolean_

  Optional. Enable structured output. Default is true.

  This is useful when the JSON Schema contains elements that are
  not supported by the OpenAPI schema version that
  Google Generative AI uses. You can use this to disable
  structured outputs if you need to.

  See [Troubleshooting: Schema Limitations](#schema-limitations) for more details.

- **safetySettings** _Array\<\{ category: string; threshold: string \}\>_

  Optional. Safety settings for the model.

  - **category** _string_

    The category of the safety setting. Can be one of the following:

    - `HARM_CATEGORY_HATE_SPEECH`
    - `HARM_CATEGORY_DANGEROUS_CONTENT`
    - `HARM_CATEGORY_HARASSMENT`
    - `HARM_CATEGORY_SEXUALLY_EXPLICIT`

  - **threshold** _string_

    The threshold of the safety setting. Can be one of the following:

    - `HARM_BLOCK_THRESHOLD_UNSPECIFIED`
    - `BLOCK_LOW_AND_ABOVE`
    - `BLOCK_MEDIUM_AND_ABOVE`
    - `BLOCK_ONLY_HIGH`
    - `BLOCK_NONE`

- **responseModalities** _string[]_
  The modalities to use for the response. The following modalities are supported: `TEXT`, `IMAGE`. When not defined or empty, the model defaults to returning only text.

- **thinkingConfig** _\{ thinkingBudget: number; includeThoughts: boolean \}_

  Optional. Configuration for the model's thinking process. Only supported by specific [Google Generative AI models](https://ai.google.dev/gemini-api/docs/thinking).

  - **thinkingBudget** _number_

    Optional. Gives the model guidance on the number of thinking tokens it can use when generating a response. Setting it to 0 disables thinking, if the model supports it.
    For more information about the possible value ranges for each model see [Google Generative AI thinking documentation](https://ai.google.dev/gemini-api/docs/thinking#set-budget).

  - **includeThoughts** _boolean_

    Optional. If set to true, thought summaries are returned, which are synthisized versions of the model's raw thoughts and offer insights into the model's internal reasoning process.

### Thinking

The Gemini 2.5 series models use an internal "thinking process" that significantly improves their reasoning and multi-step planning abilities, making them highly effective for complex tasks such as coding, advanced mathematics, and data analysis. For more information see [Google Generative AI thinking documentation](https://ai.google.dev/gemini-api/docs/thinking).

You can control thinking budgets and enable a thought summary by setting the `thinkingConfig` parameter.

```ts
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const model = google('gemini-2.5-flash');

const { text, reasoning } = await generateText({
  model: model,
  prompt: 'What is the sum of the first 10 prime numbers?',
  providerOptions: {
    google: {
      thinkingConfig: {
        thinkingBudget: 8192,
        includeThoughts: true,
      },
    },
  },
});

console.log(text);

console.log(reasoning); // Reasoning summary
```

### File Inputs

The Google Generative AI provider supports file inputs, e.g. PDF files.

```ts
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const result = await generateText({
  model: google('gemini-2.5-flash'),
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What is an embedding model according to this document?',
        },
        {
          type: 'file',
          data: fs.readFileSync('./data/ai.pdf'),
          mediaType: 'application/pdf',
        },
      ],
    },
  ],
});
```

You can also use YouTube URLs directly:

```ts
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const result = await generateText({
  model: google('gemini-2.5-flash'),
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Summarize this video',
        },
        {
          type: 'file',
          data: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          mediaType: 'video/mp4',
        },
      ],
    },
  ],
});
```

<Note>
  The AI SDK will automatically download URLs if you pass them as data, except
  for `https://generativelanguage.googleapis.com/v1beta/files/` and YouTube
  URLs. You can use the Google Generative AI Files API to upload larger files to
  that location. YouTube URLs (public or unlisted videos) are supported directly
  - you can specify one YouTube video URL per request.
</Note>

See [File Parts](/docs/foundations/prompts#file-parts) for details on how to use files in prompts.

### Cached Content

Google Generative AI supports both explicit and implicit caching to help reduce costs on repetitive content.

#### Implicit Caching

Gemini 2.5 models automatically provide cache cost savings without needing to create an explicit cache. When you send requests that share common prefixes with previous requests, you'll receive a 75% token discount on cached content.

To maximize cache hits with implicit caching:

- Keep content at the beginning of requests consistent
- Add variable content (like user questions) at the end of prompts
- Ensure requests meet minimum token requirements:
  - Gemini 2.5 Flash: 1024 tokens minimum
  - Gemini 2.5 Pro: 2048 tokens minimum

```ts
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// Structure prompts with consistent content at the beginning
const baseContext =
  'You are a cooking assistant with expertise in Italian cuisine. Here are 1000 lasagna recipes for reference...';

const { text: veggieLasagna } = await generateText({
  model: google('gemini-2.5-pro'),
  prompt: `${baseContext}\n\nWrite a vegetarian lasagna recipe for 4 people.`,
});

// Second request with same prefix - eligible for cache hit
const { text: meatLasagna, providerMetadata } = await generateText({
  model: google('gemini-2.5-pro'),
  prompt: `${baseContext}\n\nWrite a meat lasagna recipe for 12 people.`,
});

// Check cached token count in usage metadata
console.log('Cached tokens:', providerMetadata.google?.usageMetadata);
// e.g.
// {
//   groundingMetadata: null,
//   safetyRatings: null,
//   usageMetadata: {
//     cachedContentTokenCount: 2027,
//     thoughtsTokenCount: 702,
//     promptTokenCount: 2152,
//     candidatesTokenCount: 710,
//     totalTokenCount: 3564
//   }
// }
```

<Note>
  Usage metadata was added to `providerMetadata` in `@ai-sdk/google@1.2.23`. If
  you are using an older version, usage metadata is available in the raw HTTP
  `response` body returned as part of the return value from `generateText`.
</Note>

#### Explicit Caching

For guaranteed cost savings, you can still use explicit caching with Gemini 2.5 and 2.0 models. See the [models page](https://ai.google.dev/gemini-api/docs/models) to check if caching is supported for the used model:

```ts
import { google } from '@ai-sdk/google';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import { generateText } from 'ai';

const cacheManager = new GoogleAICacheManager(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY,
);

const model = 'gemini-2.5-pro';

const { name: cachedContent } = await cacheManager.create({
  model,
  contents: [
    {
      role: 'user',
      parts: [{ text: '1000 Lasagna Recipes...' }],
    },
  ],
  ttlSeconds: 60 * 5,
});

const { text: veggieLasangaRecipe } = await generateText({
  model: google(model),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
  providerOptions: {
    google: {
      cachedContent,
    },
  },
});

const { text: meatLasangaRecipe } = await generateText({
  model: google(model),
  prompt: 'Write a meat lasagna recipe for 12 people.',
  providerOptions: {
    google: {
      cachedContent,
    },
  },
});
```

### Code Execution

With [Code Execution](https://ai.google.dev/gemini-api/docs/code-execution), certain models can generate and execute Python code to perform calculations, solve problems, or provide more accurate information.

You can enable code execution by adding the `code_execution` tool to your request.

```ts
import { google } from '@ai-sdk/google';
import { googleTools } from '@ai-sdk/google/internal';
import { generateText } from 'ai';

const { text, toolCalls, toolResults } = await generateText({
  model: google('gemini-2.5-pro'),
  tools: { code_execution: google.tools.codeExecution({}) },
  prompt: 'Use python to calculate the 20th fibonacci number.',
});
```

The response will contain the tool calls and results from the code execution.

### Google Search

With [search grounding](https://ai.google.dev/gemini-api/docs/google-search),
the model has access to the latest information using Google search.
Google search can be used to provide answers around current events:

```ts highlight="8,17-20"
import { google } from '@ai-sdk/google';
import { GoogleGenerativeAIProviderMetadata } from '@ai-sdk/google';
import { generateText } from 'ai';

const { text, sources, providerMetadata } = await generateText({
  model: google('gemini-2.5-flash'),
  tools: {
    google_search: google.tools.googleSearch({}),
  },
  prompt:
    'List the top 5 San Francisco news from the past week.' +
    'You must include the date of each article.',
});

// access the grounding metadata. Casting to the provider metadata type
// is optional but provides autocomplete and type safety.
const metadata = providerMetadata?.google as
  | GoogleGenerativeAIProviderMetadata
  | undefined;
const groundingMetadata = metadata?.groundingMetadata;
const safetyRatings = metadata?.safetyRatings;
```

When Search Grounding is enabled, the model will include sources in the response.

Additionally, the grounding metadata includes detailed information about how search results were used to ground the model's response. Here are the available fields:

- **`webSearchQueries`** (`string[] | null`)

  - Array of search queries used to retrieve information
  - Example: `["What's the weather in Chicago this weekend?"]`

- **`searchEntryPoint`** (`{ renderedContent: string } | null`)

  - Contains the main search result content used as an entry point
  - The `renderedContent` field contains the formatted content

- **`groundingSupports`** (Array of support objects | null)
  - Contains details about how specific response parts are supported by search results
  - Each support object includes:
    - **`segment`**: Information about the grounded text segment
      - `text`: The actual text segment
      - `startIndex`: Starting position in the response
      - `endIndex`: Ending position in the response
    - **`groundingChunkIndices`**: References to supporting search result chunks
    - **`confidenceScores`**: Confidence scores (0-1) for each supporting chunk

Example response:

```json
{
  "groundingMetadata": {
    "webSearchQueries": ["What's the weather in Chicago this weekend?"],
    "searchEntryPoint": {
      "renderedContent": "..."
    },
    "groundingSupports": [
      {
        "segment": {
          "startIndex": 0,
          "endIndex": 65,
          "text": "Chicago weather changes rapidly, so layers let you adjust easily."
        },
        "groundingChunkIndices": [0],
        "confidenceScores": [0.99]
      }
    ]
  }
}
```

### URL Context

Google provides a provider-defined URL context tool.

The URL context tool allows the you to provide specific URLs that you want the model to analyze directly in from the prompt.

```ts highlight="9,13-17"
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const { text, sources, providerMetadata } = await generateText({
  model: google('gemini-2.5-flash'),
  prompt: `Based on the document: https://ai.google.dev/gemini-api/docs/url-context.
          Answer this question: How many links we can consume in one request?`,
  tools: {
    url_context: google.tools.urlContext({}),
  },
});

const metadata = providerMetadata?.google as
  | GoogleGenerativeAIProviderMetadata
  | undefined;
const groundingMetadata = metadata?.groundingMetadata;
const urlContextMetadata = metadata?.urlContextMetadata;
```

The URL context metadata includes detailed information about how the model used the URL context to generate the response. Here are the available fields:

- **`urlMetadata`** (`{ retrievedUrl: string; urlRetrievalStatus: string; }[] | null`)

  - Array of URL context metadata
  - Each object includes:
    - **`retrievedUrl`**: The URL of the context
    - **`urlRetrievalStatus`**: The status of the URL retrieval

Example response:

```json
{
  "urlMetadata": [
    {
      "retrievedUrl": "https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai",
      "urlRetrievalStatus": "URL_RETRIEVAL_STATUS_SUCCESS"
    }
  ]
}
```

With the URL context tool, you will also get the `groundingMetadata`.

```json
"groundingMetadata": {
    "groundingChunks": [
        {
            "web": {
                "uri": "https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai",
                "title": "Google Generative AI - AI SDK Providers"
            }
        }
    ],
    "groundingSupports": [
        {
            "segment": {
                "startIndex": 67,
                "endIndex": 157,
                "text": "**Installation**: Install the `@ai-sdk/google` module using your preferred package manager"
            },
            "groundingChunkIndices": [
                0
            ]
        },
    ]
}
```

<Note>You can add up to 20 URLs per request.</Note>

<Note>
  The URL context tool is only supported for Gemini 2.0 Flash models and above.
  Check the [supported models for URL context
  tool](https://ai.google.dev/gemini-api/docs/url-context#supported-models).
</Note>

#### Combine URL Context with Search Grounding

You can combine the URL context tool with search grounding to provide the model with the latest information from the web.

```ts highlight="9-10"
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const { text, sources, providerMetadata } = await generateText({
  model: google('gemini-2.5-flash'),
  prompt: `Based on this context: https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai, tell me how to use Gemini with AI SDK.
    Also, provide the latest news about AI SDK V5.`,
  tools: {
    google_search: google.tools.googleSearch({}),
    url_context: google.tools.urlContext({}),
  },
});

const metadata = providerMetadata?.google as
  | GoogleGenerativeAIProviderMetadata
  | undefined;
const groundingMetadata = metadata?.groundingMetadata;
const urlContextMetadata = metadata?.urlContextMetadata;
```

### Image Outputs

Gemini models with image generation capabilities (`gemini-2.5-flash-image-preview`) support image generation. Images are exposed as files in the response.
You need to enable image output in the provider options using the `responseModalities` option.

```ts
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const result = await generateText({
  model: google('gemini-2.5-flash-image-preview'),
  providerOptions: {
    google: { responseModalities: ['TEXT', 'IMAGE'] },
  },
  prompt:
    'Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme',
});

for (const file of result.files) {
  if (file.mediaType.startsWith('image/')) {
    console.log('Generated image:', file);
  }
}
```

### Safety Ratings

The safety ratings provide insight into the safety of the model's response.
See [Google AI documentation on safety settings](https://ai.google.dev/gemini-api/docs/safety-settings).

Example response excerpt:

```json
{
  "safetyRatings": [
    {
      "category": "HARM_CATEGORY_HATE_SPEECH",
      "probability": "NEGLIGIBLE",
      "probabilityScore": 0.11027937,
      "severity": "HARM_SEVERITY_LOW",
      "severityScore": 0.28487435
    },
    {
      "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
      "probability": "HIGH",
      "blocked": true,
      "probabilityScore": 0.95422274,
      "severity": "HARM_SEVERITY_MEDIUM",
      "severityScore": 0.43398145
    },
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "probability": "NEGLIGIBLE",
      "probabilityScore": 0.11085559,
      "severity": "HARM_SEVERITY_NEGLIGIBLE",
      "severityScore": 0.19027223
    },
    {
      "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      "probability": "NEGLIGIBLE",
      "probabilityScore": 0.22901751,
      "severity": "HARM_SEVERITY_NEGLIGIBLE",
      "severityScore": 0.09089675
    }
  ]
}
```

### Troubleshooting

#### Schema Limitations

The Google Generative AI API uses a subset of the OpenAPI 3.0 schema,
which does not support features such as unions.
The errors that you get in this case look like this:

`GenerateContentRequest.generation_config.response_schema.properties[occupation].type: must be specified`

By default, structured outputs are enabled (and for tool calling they are required).
You can disable structured outputs for object generation as a workaround:

```ts highlight="3,8"
const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  providerOptions: {
    google: {
      structuredOutputs: false,
    },
  },
  schema: z.object({
    name: z.string(),
    age: z.number(),
    contact: z.union([
      z.object({
        type: z.literal('email'),
        value: z.string(),
      }),
      z.object({
        type: z.literal('phone'),
        value: z.string(),
      }),
    ]),
  }),
  prompt: 'Generate an example person for testing.',
});
```

The following Zod features are known to not work with Google Generative AI:

- `z.union`
- `z.record`

### Model Capabilities

| Model                                 | Image Input         | Object Generation   | Tool Usage          | Tool Streaming      | Google Search       | URL Context         |
| ------------------------------------- | ------------------- | ------------------- | ------------------- | ------------------- | ------------------- | ------------------- |
| `gemini-2.5-pro`                      | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gemini-2.5-flash`                    | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gemini-2.5-flash-lite`               | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gemini-2.5-flash-lite-preview-06-17` | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gemini-2.0-flash`                    | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `gemini-1.5-pro`                      | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Cross size={18} /> |
| `gemini-1.5-pro-latest`               | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Cross size={18} /> |
| `gemini-1.5-flash`                    | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Cross size={18} /> |
| `gemini-1.5-flash-latest`             | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Cross size={18} /> |
| `gemini-1.5-flash-8b`                 | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Cross size={18} /> |
| `gemini-1.5-flash-8b-latest`          | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Cross size={18} /> |

<Note>
  The table above lists popular models. Please see the [Google Generative AI
  docs](https://ai.google.dev/gemini-api/docs/models/) for a full list of
  available models. The table above lists popular models. You can also pass any
  available provider model ID as a string if needed.
</Note>

## Gemma Models

You can use [Gemma models](https://deepmind.google/models/gemma/) with the Google Generative AI API.

Gemma models don't natively support the `systemInstruction` parameter, but the provider automatically handles system instructions by prepending them to the first user message. This allows you to use system instructions with Gemma models seamlessly:

```ts
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const { text } = await generateText({
  model: google('gemma-3-27b-it'),
  system: 'You are a helpful assistant that responds concisely.',
  prompt: 'What is machine learning?',
});
```

The system instruction is automatically formatted and included in the conversation, so Gemma models can follow the guidance without any additional configuration.

## Embedding Models

You can create models that call the [Google Generative AI embeddings API](https://ai.google.dev/gemini-api/docs/embeddings)
using the `.textEmbedding()` factory method.

```ts
const model = google.textEmbedding('gemini-embedding-001');
```

The Google Generative AI provider sends API calls to the right endpoint based on the type of embedding:

- **Single embeddings**: When embedding a single value with `embed()`, the provider uses the single `:embedContent` endpoint, which typically has higher rate limits compared to the batch endpoint.
- **Batch embeddings**: When embedding multiple values with `embedMany()` or multiple values in `embed()`, the provider uses the `:batchEmbedContents` endpoint.

Google Generative AI embedding models support aditional settings. You can pass them as an options argument:

```ts
import { google } from '@ai-sdk/google';
import { embed } from 'ai';

const model = google.textEmbedding('gemini-embedding-001');

const { embedding } = await embed({
  model,
  value: 'sunny day at the beach',
  providerOptions: {
    google: {
      outputDimensionality: 512, // optional, number of dimensions for the embedding
      taskType: 'SEMANTIC_SIMILARITY', // optional, specifies the task type for generating embeddings
    },
  },
});
```

The following optional provider options are available for Google Generative AI embedding models:

- **outputDimensionality**: _number_

  Optional reduced dimension for the output embedding. If set, excessive values in the output embedding are truncated from the end.

- **taskType**: _string_

  Optional. Specifies the task type for generating embeddings. Supported task types include:

  - `SEMANTIC_SIMILARITY`: Optimized for text similarity.
  - `CLASSIFICATION`: Optimized for text classification.
  - `CLUSTERING`: Optimized for clustering texts based on similarity.
  - `RETRIEVAL_DOCUMENT`: Optimized for document retrieval.
  - `RETRIEVAL_QUERY`: Optimized for query-based retrieval.
  - `QUESTION_ANSWERING`: Optimized for answering questions.
  - `FACT_VERIFICATION`: Optimized for verifying factual information.
  - `CODE_RETRIEVAL_QUERY`: Optimized for retrieving code blocks based on natural language queries.

### Model Capabilities

| Model                  | Default Dimensions | Custom Dimensions   |
| ---------------------- | ------------------ | ------------------- |
| `gemini-embedding-001` | 3072               | <Check size={18} /> |
| `text-embedding-004`   | 768                | <Check size={18} /> |

## Image Models

You can create [Imagen](https://ai.google.dev/gemini-api/imagen) models that call the Google Generative AI API using the `.image()` factory method.
For more on image generation with the AI SDK see [generateImage()](/docs/reference/ai-sdk-core/generate-image).

```ts
import { google } from '@ai-sdk/google';
import { experimental_generateImage as generateImage } from 'ai';

const { image } = await generateImage({
  model: google.image('imagen-3.0-generate-002'),
  prompt: 'A futuristic cityscape at sunset',
  aspectRatio: '16:9',
});
```

Further configuration can be done using Google provider options. You can validate the provider options using the `GoogleGenerativeAIImageProviderOptions` type.

```ts
import { google } from '@ai-sdk/google';
import { GoogleGenerativeAIImageProviderOptions } from '@ai-sdk/google';
import { experimental_generateImage as generateImage } from 'ai';

const { image } = await generateImage({
  model: google.image('imagen-3.0-generate-002'),
  providerOptions: {
    google: {
      personGeneration: 'dont_allow',
    } satisfies GoogleGenerativeAIImageProviderOptions,
  },
  // ...
});
```

The following provider options are available:

- **personGeneration** `allow_adult` | `allow_all` | `dont_allow`
  Whether to allow person generation. Defaults to `allow_adult`.

<Note>
  Imagen models do not support the `size` parameter. Use the `aspectRatio`
  parameter instead.
</Note>

#### Model Capabilities

| Model                     | Aspect Ratios             |
| ------------------------- | ------------------------- |
| `imagen-3.0-generate-002` | 1:1, 3:4, 4:3, 9:16, 16:9 |


# AI Gateway Provider

The [AI Gateway](https://vercel.com/docs/ai-gateway) provider connects you to models from multiple AI providers through a single interface. Instead of integrating with each provider separately, you can access OpenAI, Anthropic, Google, Meta, xAI, and other providers and their models.

## Features

- Access models from multiple providers without having to install additional provider modules/dependencies
- Use the same code structure across different AI providers
- Switch between models and providers easily
- Automatic authentication when deployed on Vercel
- View pricing information across providers
- Observability for AI model usage through the Vercel dashboard

## Setup

The AI Gateway provider is available in the `@ai-sdk/gateway` module. You can install it with

<Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
  <Tab>
    <Snippet text="pnpm add @ai-sdk/gateway" dark />
  </Tab>
  <Tab>
    <Snippet text="npm install @ai-sdk/gateway" dark />
  </Tab>
  <Tab>
    <Snippet text="yarn add @ai-sdk/gateway" dark />
  </Tab>

  <Tab>
    <Snippet text="bun add @ai-sdk/gateway" dark />
  </Tab>
</Tabs>

## Basic Usage

For most use cases, you can use the AI Gateway directly with a model string:

```ts
// use plain model string with global provider
import { generateText } from 'ai';

const { text } = await generateText({
  model: 'openai/gpt-5',
  prompt: 'Hello world',
});
```

```ts
// use provider instance
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

const { text } = await generateText({
  model: gateway('openai/gpt-5'),
  prompt: 'Hello world',
});
```

The AI SDK automatically uses the AI Gateway when you pass a model string in the `creator/model-name` format.

## Provider Instance

You can also import the default provider instance `gateway` from `@ai-sdk/gateway`:

```ts
import { gateway } from '@ai-sdk/gateway';
```

You may want to create a custom provider instance when you need to:

- Set custom configuration options (API key, base URL, headers)
- Use the provider in a [provider registry](/docs/ai-sdk-core/provider-registry)
- Wrap the provider with [middleware](/docs/ai-sdk-core/middleware)
- Use different settings for different parts of your application

To create a custom provider instance, import `createGateway` from `@ai-sdk/gateway`:

```ts
import { createGateway } from '@ai-sdk/gateway';

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? '',
});
```

You can use the following optional settings to customize the AI Gateway provider instance:

- **baseURL** _string_

  Use a different URL prefix for API calls. The default prefix is `https://ai-gateway.vercel.sh/v1/ai`.

- **apiKey** _string_

  API key that is being sent using the `Authorization` header. It defaults to
  the `AI_GATEWAY_API_KEY` environment variable.

- **headers** _Record&lt;string,string&gt;_

  Custom headers to include in the requests.

- **fetch** _(input: RequestInfo, init?: RequestInit) => Promise&lt;Response&gt;_

  Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation.
  Defaults to the global `fetch` function.
  You can use it as a middleware to intercept requests,
  or to provide a custom fetch implementation for e.g. testing.

- **metadataCacheRefreshMillis** _number_

  How frequently to refresh the metadata cache in milliseconds. Defaults to 5 minutes (300,000ms).

## Authentication

The Gateway provider supports two authentication methods:

### API Key Authentication

Set your API key via environment variable:

```bash
AI_GATEWAY_API_KEY=your_api_key_here
```

Or pass it directly to the provider:

```ts
import { createGateway } from '@ai-sdk/gateway';

const gateway = createGateway({
  apiKey: 'your_api_key_here',
});
```

### OIDC Authentication (Vercel Deployments)

When deployed to Vercel, the AI Gateway provider supports authenticating using [OIDC (OpenID Connect)
tokens](https://vercel.com/docs/oidc) without API Keys.

#### How OIDC Authentication Works

1. **In Production/Preview Deployments**:

   - OIDC authentication is automatically handled
   - No manual configuration needed
   - Tokens are automatically obtained and refreshed

2. **In Local Development**:
   - First, install and authenticate with the [Vercel CLI](https://vercel.com/docs/cli)
   - Run `vercel env pull` to download your project's OIDC token locally
   - For automatic token management:
     - Use `vercel dev` to start your development server - this will handle token refreshing automatically
   - For manual token management:
     - If not using `vercel dev`, note that OIDC tokens expire after 12 hours
     - You'll need to run `vercel env pull` again to refresh the token before it expires

<Note>
  If an API Key is present (either passed directly or via environment), it will
  always be used, even if invalid.
</Note>

Read more about using OIDC tokens in the [Vercel AI Gateway docs](https://vercel.com/docs/ai-gateway#using-the-ai-gateway-with-a-vercel-oidc-token).

## Language Models

You can create language models using a provider instance. The first argument is the model ID in the format `creator/model-name`:

```ts
import { generateText } from 'ai';

const { text } = await generateText({
  model: 'openai/gpt-5',
  prompt: 'Explain quantum computing in simple terms',
});
```

AI Gateway language models can also be used in the `streamText`, `generateObject`, and `streamObject` functions (see [AI SDK Core](/docs/ai-sdk-core)).

## Available Models

The AI Gateway supports models from OpenAI, Anthropic, Google, Meta, xAI, Mistral, DeepSeek, Amazon Bedrock, Cohere, Perplexity, Alibaba, and other providers.

For the complete list of available models, see the [AI Gateway documentation](https://vercel.com/docs/ai-gateway).

## Dynamic Model Discovery

You can discover available models programmatically:

```ts
import { gateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';

const availableModels = await gateway.getAvailableModels();

// List all available models
availableModels.models.forEach(model => {
  console.log(`${model.id}: ${model.name}`);
  if (model.description) {
    console.log(`  Description: ${model.description}`);
  }
  if (model.pricing) {
    console.log(`  Input: $${model.pricing.input}/token`);
    console.log(`  Output: $${model.pricing.output}/token`);
    if (model.pricing.cachedInputTokens) {
      console.log(
        `  Cached input (read): $${model.pricing.cachedInputTokens}/token`,
      );
    }
    if (model.pricing.cacheCreationInputTokens) {
      console.log(
        `  Cache creation (write): $${model.pricing.cacheCreationInputTokens}/token`,
      );
    }
  }
});

// Use any discovered model with plain string
const { text } = await generateText({
  model: availableModels.models[0].id, // e.g., 'openai/gpt-4o'
  prompt: 'Hello world',
});
```

## Examples

### Basic Text Generation

```ts
import { generateText } from 'ai';

const { text } = await generateText({
  model: 'anthropic/claude-sonnet-4',
  prompt: 'Write a haiku about programming',
});

console.log(text);
```

### Streaming

```ts
import { streamText } from 'ai';

const { textStream } = await streamText({
  model: 'openai/gpt-5',
  prompt: 'Explain the benefits of serverless architecture',
});

for await (const textPart of textStream) {
  process.stdout.write(textPart);
}
```

### Tool Usage

```ts
import { generateText, tool } from 'ai';
import { z } from 'zod';

const { text } = await generateText({
  model: 'xai/grok-4',
  prompt: 'What is the weather like in San Francisco?',
  tools: {
    getWeather: tool({
      description: 'Get the current weather for a location',
      parameters: z.object({
        location: z.string().describe('The location to get weather for'),
      }),
      execute: async ({ location }) => {
        // Your weather API call here
        return `It's sunny in ${location}`;
      },
    }),
  },
});
```

## Provider Options

When using provider-specific options, use the actual provider name (e.g. `anthropic` not `gateway`) as the key:

```ts
// with model string
import { generateText } from 'ai';

const { text } = await generateText({
  model: 'anthropic/claude-sonnet-4',
  prompt: 'Explain quantum computing',
  providerOptions: {
    anthropic: {
      thinking: { type: 'enabled', budgetTokens: 12000 },
    },
  },
});
```

```ts
// with provider instance
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

const { text } = await generateText({
  model: gateway('anthropic/claude-sonnet-4'),
  prompt: 'Explain quantum computing',
  providerOptions: {
    anthropic: {
      thinking: { type: 'enabled', budgetTokens: 12000 },
    },
  },
});
```

The AI Gateway provider also accepts its own set of options. Refer to the [AI Gateway provider options documentation](https://vercel.com/docs/ai-gateway/provider-options).

## Model Capabilities

Model capabilities depend on the specific provider and model you're using. For detailed capability information, see:

- [AI Gateway provider options](https://vercel.com/docs/ai-gateway/provider-options#available-providers) for an overview of available providers
- Individual [AI SDK provider pages](/providers/ai-sdk-providers) for specific model capabilities and features
# Provider Options

AI Gateway can route your AI model requests across multiple AI providers. Each provider offers different models, pricing, and performance characteristics. By default, AI Gateway will automatically choose providers for you to ensure fast and dependable responses.

With the Gateway Provider Options, you can control the routing order and fallback behavior of the models.

If you want to customize individual AI model provider settings rather than general AI Gateway behavior, please refer to the model-specific provider options in the [AI SDK documentation](https://ai-sdk.dev/docs/foundations/prompts#provider-options).

## [Basic provider ordering](#basic-provider-ordering)

You can use the `order` array to specify the sequence in which providers should be attempted. Providers are specified using their `slug` string. You can find the slugs in the [table of available providers](#available-providers).

You can also copy the provider slug using the copy button next to a provider's name on a model's detail page. In the Vercel Dashboard:

1.  Click the AI Gateway tab,
2.  Then, click the Model List sub-tab on the left
3.  Click a model entry in the list.

The bottom section of the page lists the available providers for that model. The copy button next to a provider's name will copy their slug for pasting.

### [Getting started with adding a provider option](#getting-started-with-adding-a-provider-option)

1.  ### [Install the AI SDK package](#install-the-ai-sdk-package)
    
    First, ensure you have the necessary package installed:
    
    ```
    pnpm install ai
    ```
    
2.  ### [Configure the provider order in your request](#configure-the-provider-order-in-your-request)
    
    Use the `providerOptions.gateway.order` configuration:
    
    ```
    import { streamText } from 'ai';
     
    export async function POST(request: Request) {
      const { prompt } = await request.json();
     
      const result = streamText({
        model: 'anthropic/claude-sonnet-4',
        prompt,
        providerOptions: {
          gateway: {
            order: ['bedrock', 'anthropic'], // Try Amazon Bedrock first, then Anthropic
          },
        },
      });
     
      return result.toUIMessageStreamResponse();
    }
    ```
    
    In this example:
    
    *   The gateway will first attempt to use Amazon Bedrock to serve the Claude 4 Sonnet model
    *   If Amazon Bedrock is unavailable or fails, it will fall back to Anthropic
    *   Other providers (like Vertex AI) are still available but will only be used after the specified providers
3.  ### [Test the routing behavior](#test-the-routing-behavior)
    
    You can monitor which provider you used by checking the provider metadata in the response.
    
    ```
    import { streamText } from 'ai';
     
    export async function POST(request: Request) {
      const { prompt } = await request.json();
     
      const result = streamText({
        model: 'anthropic/claude-sonnet-4',
        prompt,
        providerOptions: {
          gateway: {
            order: ['bedrock', 'anthropic'],
          },
        },
      });
     
      // Log which provider was actually used
      console.log(JSON.stringify(await result.providerMetadata, null, 2));
     
      return result.toUIMessageStreamResponse();
    }
    ```
    

## [Example provider metadata output](#example-provider-metadata-output)

```
{
  "novita": {}, // final provider-specific metadata, if any -- can be empty
  "gateway": {
    // gateway-specific metadata
    "routing": {
      "originalModelId": "zai/glm-4.5",
      "resolvedProvider": "novita",
      "resolvedProviderApiModelId": "zai-org/glm-4.5",
      "fallbacksAvailable": ["zai"],
      "planningReasoning": "System credentials planned for: novita, zai. Total execution order: novita(system) → zai(system)",
      "canonicalSlug": "zai/glm-4.5",
      "finalProvider": "novita",
      "attempts": [
        {
          "provider": "novita",
          "providerApiModelId": "zai-org/glm-4.5",
          "credentialType": "system",
          "success": true,
          "startTime": 1754638578812,
          "endTime": 1754638579575
        }
      ]
    },
    "cost": "0.0006766"
  }
}
```

The `gateway.cost` value is the amount debited from your AI Gateway Credits balance for this request. It is returned as a decimal string. For more on pricing see [Pricing](/docs/ai-gateway/pricing).

In cases where your request encounters issues with one or more providers or if your BYOK credentials fail, you'll find error detail in the `attempts` field of the provider metadata:

```
"attempts": [
  {
    "provider": "novita",
    "providerApiModelId": "zai-org/glm-4.5",
    "credentialType": "byok",
    "success": false,
    "error": "Unauthorized",
    "startTime": 1754639042520,
    "endTime": 1754639042710
  },
  {
    "provider": "novita",
    "providerApiModelId": "zai-org/glm-4.5",
    "credentialType": "system",
    "success": true,
    "startTime": 1754639042710,
    "endTime": 1754639043353
  }
]
```

## [Restrict providers with the `only` filter](#restrict-providers-with-the-only-filter)

Use the `only` array to restrict routing to a specific subset of providers. Providers are specified by their slug and are matched against the model's available providers.

```
import { streamText } from 'ai';
 
export async function POST(request: Request) {
  const { prompt } = await request.json();
 
  const result = streamText({
    model: 'anthropic/claude-sonnet-4',
    prompt,
    providerOptions: {
      gateway: {
        only: ['bedrock', 'anthropic'], // Only consider these providers.
        // This model is also available via 'vertex', but it won't be considered.
      },
    },
  });
 
  return result.toUIMessageStreamResponse();
}
```

In this example:

*   Restriction: Only `bedrock` and `anthropic` will be considered for routing and fallbacks.
*   Error on mismatch: If none of the specified providers are available for the model, the request fails with an error indicating the allowed providers.

## [Using `only` together with `order`](#using-only-together-with-order)

When both `only` and `order` are provided, the `only` filter is applied first to define the allowed set, and then `order` defines the priority within that filtered set. Practically, the end result is the same as taking your `order` list and intersecting it with the `only` list.

```
import { streamText } from 'ai';
 
export async function POST(request: Request) {
  const { prompt } = await request.json();
 
  const result = streamText({
    model: 'anthropic/claude-sonnet-4',
    prompt,
    providerOptions: {
      gateway: {
        only: ['anthropic', 'vertex'],
        order: ['vertex', 'bedrock', 'anthropic'],
      },
    },
  });
 
  return result.toUIMessageStreamResponse();
}
```

The final order will be `vertex → anthropic` (providers listed in `order` but not in `only` are ignored).

## [Combining AI Gateway provider options with provider-specific options](#combining-ai-gateway-provider-options-with-provider-specific-options)

You can combine AI Gateway provider options with provider-specific options. This allows you to control both the routing behavior and provider-specific settings in the same request:

```
import { streamText } from 'ai';
 
export async function POST(request: Request) {
  const { prompt } = await request.json();
 
  const result = streamText({
    model: 'anthropic/claude-sonnet-4',
    prompt,
    providerOptions: {
      anthropic: {
        thinkingBudget: 0.001,
      },
      gateway: {
        order: ['vertex'],
      },
    },
  });
 
  return result.toUIMessageStreamResponse();
}
```

In this example:

*   We're using an Anthropic model (e.g. Claude 4 Sonnet) but accessing it through Vertex AI
*   The Anthropic-specific options still apply to the model:
    *   `thinkingBudget` sets a cost limit of $0.001 per request for the Claude model
*   You can read more about provider-specific options in the [AI SDK documentation](https://ai-sdk.dev/docs/foundations/prompts#provider-options)

## [Reasoning](#reasoning)

For models that support reasoning (also known as "thinking"), you can use `providerOptions` to configure reasoning behavior. The example below shows how to control the computational effort and summary detail level when using OpenAI's `gpt-oss-120b` model.

For more details on reasoning support across different models and providers, see the [AI SDK providers documentation](https://ai-sdk.dev/providers/ai-sdk-providers), including [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai#reasoning), [DeepSeek](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek#reasoning), and [Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic#reasoning).

```
import { streamText } from 'ai';
 
export async function POST(request: Request) {
  const { prompt } = await request.json();
 
  const result = streamText({
    model: 'openai/gpt-oss-120b',
    prompt,
    providerOptions: {
      openai: {
        reasoningEffort: 'high',
        reasoningSummary: 'detailed',
      },
    },
  });
 
  return result.toUIMessageStreamResponse();
}
```

## [Available providers](#available-providers)

You can view the available models for a provider in the Model List section under the [AI Gateway](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway) tab in your Vercel dashboard or in the public [models page](https://vercel.com/ai-gateway/models).

| Slug | Name | Website |
| --- | --- | --- |
| `anthropic` | [Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) | [anthropic.com](https://anthropic.com) |
| `azure` | [Azure](https://ai-sdk.dev/providers/ai-sdk-providers/azure) | [ai.azure.com](https://ai.azure.com/) |
| `baseten` | [Baseten](https://ai-sdk.dev/providers/openai-compatible-providers/baseten) | [baseten.co](https://www.baseten.co/)  |
| `bedrock` | [Amazon Bedrock](https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock) | [aws.amazon.com/bedrock](https://aws.amazon.com/bedrock) |
| `cerebras` | [Cerebras](https://ai-sdk.dev/providers/ai-sdk-providers/cerebras) | [cerebras.net](https://www.cerebras.net) |
| `cohere` | [Cohere](https://ai-sdk.dev/providers/ai-sdk-providers/cohere) | [cohere.com](https://cohere.com) |
| `deepinfra` | [DeepInfra](https://ai-sdk.dev/providers/ai-sdk-providers/deepinfra) | [deepinfra.com](https://deepinfra.com) |
| `deepseek` | [DeepSeek](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek) | [deepseek.ai](https://deepseek.ai) |
| `fireworks` | [Fireworks](https://ai-sdk.dev/providers/ai-sdk-providers/fireworks) | [fireworks.ai](https://fireworks.ai) |
| `google` | [Google](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai) | [ai.google.dev](https://ai.google.dev/) |
| `groq` | [Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq) | [groq.com](https://groq.com) |
| `inception` | Inception | [inceptionlabs.ai](https://inceptionlabs.ai) |
| `mistral` | [Mistral](https://ai-sdk.dev/providers/ai-sdk-providers/mistral) | [mistral.ai](https://mistral.ai) |
| `moonshotai` | Moonshot AI | [moonshot.ai](https://www.moonshot.ai) |
| `morph` | Morph | [morphllm.com](https://morphllm.com) |
| `novita` | Novita | [novita.ai](https://novita.ai/) |
| `openai` | [OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) | [openai.com](https://openai.com) |
| `parasail` | Parasail | [parasail.com](https://www.parasail.io) |
| `perplexity` | [Perplexity](https://ai-sdk.dev/providers/ai-sdk-providers/perplexity) | [perplexity.ai](https://www.perplexity.ai) |
| `vercel` | [Vercel](https://ai-sdk.dev/providers/ai-sdk-providers/vercel) |  |
| `vertex` | [Vertex AI](https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex) | [cloud.google.com/vertex-ai](https://cloud.google.com/vertex-ai) |
| `xai` | [xAI](https://ai-sdk.dev/providers/ai-sdk-providers/xai) | [x.ai](https://x.ai) |
| `zai` | Z.ai | [z.ai](https://z.ai/model-api) |

Provider availability may vary by model. Some models may only be available through specific providers or may have different capabilities depending on the provider used.
# OpenAI-Compatible API

AI Gateway provides OpenAI-compatible API endpoints, letting you use multiple AI providers through a familiar interface. You can use existing OpenAI client libraries, switch to the AI Gateway with a URL change, and keep your current tools and workflows without code rewrites.

The OpenAI-compatible API implements the same specification as the [OpenAI API](https://platform.openai.com/docs/api-reference/chat).

## [Base URL](#base-url)

The OpenAI-compatible API is available at the following base URL:

`https://ai-gateway.vercel.sh/v1`

## [Authentication](#authentication)

The OpenAI-compatible API supports the same authentication methods as the main AI Gateway:

*   API key: Use your AI Gateway API key with the `Authorization: Bearer <token>` header
*   OIDC token: Use your Vercel OIDC token with the `Authorization: Bearer <token>` header

You only need to use one of these forms of authentication. If an API key is specified it will take precedence over any OIDC token, even if the API key is invalid.

## [Supported endpoints](#supported-endpoints)

The AI Gateway currently supports the following OpenAI-compatible endpoints:

*   [`GET /v1/models`](#list-models) - List available models
*   [`GET /v1/models/{model}`](#retrieve-model) - Retrieve a specific model
*   [`POST /v1/chat/completions`](#chat-completions) - Create chat completions with support for streaming, attachments, tool calls, and image generation
*   [`POST /v1/embeddings`](#embeddings) - Generate vector embeddings

## [Integration with existing tools](#integration-with-existing-tools)

You can use the AI Gateway's OpenAI-compatible API with existing tools and libraries like the [OpenAI client libraries](https://platform.openai.com/docs/libraries) and [AI SDK 4](https://v4.ai-sdk.dev/). Point your existing client to the AI Gateway's base URL and use your AI Gateway [API key](/docs/ai-gateway/authentication#api-key) or [OIDC token](/docs/ai-gateway/authentication#oidc-token) for authentication.

### [OpenAI client libraries](#openai-client-libraries)

TypeScriptPython

```
import OpenAI from 'openai';
 
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const response = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [{ role: 'user', content: 'Hello, world!' }],
});
```

```
import os
from openai import OpenAI
 
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
response = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {'role': 'user', 'content': 'Hello, world!'}
    ]
)
```

### [AI SDK 4](#ai-sdk-4)

For compatibility with [AI SDK v4](https://v4.ai-sdk.dev/) and AI Gateway, install the [@ai-sdk/openai-compatible](https://ai-sdk.dev/providers/openai-compatible-providers) package.

Verify that you are using AI SDK 4 by using the following package versions: `@ai-sdk/openai-compatible` version `<1.0.0` (e.g., `0.2.16`) and `ai` version `<5.0.0` (e.g., `4.3.19`).

```
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
 
const gateway = createOpenAICompatible({
  name: 'openai',
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const response = await generateText({
  model: gateway('anthropic/claude-sonnet-4'),
  prompt: 'Hello, world!',
});
```

## [List models](#list-models)

Retrieve a list of all available models that can be used with the AI Gateway.

Endpoint

`GET /v1/models`

Example request

```
import OpenAI from 'openai';
 
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const models = await openai.models.list();
console.log(models);
```

```
import os
from openai import OpenAI
 
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
models = client.models.list()
print(models)
```

Response format

The response follows the OpenAI API format:

```
{
  "object": "list",
  "data": [
    {
      "id": "anthropic/claude-sonnet-4",
      "object": "model",
      "created": 1677610602,
      "owned_by": "anthropic"
    },
    {
      "id": "openai/gpt-4.1-mini",
      "object": "model",
      "created": 1677610602,
      "owned_by": "openai"
    }
  ]
}
```

## [Retrieve model](#retrieve-model)

Retrieve details about a specific model.

Endpoint

`GET /v1/models/{model}`

Parameters

*   `model` (required): The model ID to retrieve (e.g., `anthropic/claude-sonnet-4`)

Example request

```
import OpenAI from 'openai';
 
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const model = await openai.models.retrieve('anthropic/claude-sonnet-4');
console.log(model);
```

```
import os
from openai import OpenAI
 
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
model = client.models.retrieve('anthropic/claude-sonnet-4')
print(model)
```

Response format

```
{
  "id": "anthropic/claude-sonnet-4",
  "object": "model",
  "created": 1677610602,
  "owned_by": "anthropic"
}
```

## [Chat completions](#chat-completions)

Create chat completions using various AI models available through the AI Gateway.

Endpoint

`POST /v1/chat/completions`

### [Basic chat completion](#basic-chat-completion)

Create a non-streaming chat completion.

Example request

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: 'Write a one-sentence bedtime story about a unicorn.',
    },
  ],
  stream: false,
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tokens used:', completion.usage);
```

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'Write a one-sentence bedtime story about a unicorn.'
        }
    ],
    stream=False,
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tokens used:', completion.usage)
```

Response format

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "anthropic/claude-sonnet-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Once upon a time, a gentle unicorn with a shimmering silver mane danced through moonlit clouds, sprinkling stardust dreams upon sleeping children below."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 28,
    "total_tokens": 43
  }
}
```

### [Streaming chat completion](#streaming-chat-completion)

Create a streaming chat completion that streams tokens as they are generated.

Example request

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const stream = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: 'Write a one-sentence bedtime story about a unicorn.',
    },
  ],
  stream: true,
});
 
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
stream = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'Write a one-sentence bedtime story about a unicorn.'
        }
    ],
    stream=True,
)
 
for chunk in stream:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end='', flush=True)
```

#### [Streaming response format](#streaming-response-format)

Streaming responses are sent as [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events), a web standard for real-time data streaming over HTTP. Each event contains a JSON object with the partial response data.

The response format follows the OpenAI streaming specification:

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"anthropic/claude-sonnet-4","choices":[{"index":0,"delta":{"content":"Once"},"finish_reason":null}]}
 
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"anthropic/claude-sonnet-4","choices":[{"index":0,"delta":{"content":" upon"},"finish_reason":null}]}
 
data: [DONE]
```

Key characteristics:

*   Each line starts with `data:` followed by JSON
*   Content is delivered incrementally in the `delta.content` field
*   The stream ends with `data: [DONE]`
*   Empty lines separate events

SSE Parsing Libraries:

If you're building custom SSE parsing (instead of using the OpenAI SDK), these libraries can help:

*   JavaScript/TypeScript: [`eventsource-parser`](https://www.npmjs.com/package/eventsource-parser) - Robust SSE parsing with support for partial events
*   Python: [`httpx-sse`](https://pypi.org/project/httpx-sse/) - SSE support for HTTPX, or [`sseclient-py`](https://pypi.org/project/sseclient-py/) for requests

For more details about the SSE specification, see the [W3C specification](https://html.spec.whatwg.org/multipage/server-sent-events.html).

### [Image attachments](#image-attachments)

Send images as part of your chat completion request.

Example request

```
import fs from 'node:fs';
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// Read the image file as base64
const imageBuffer = fs.readFileSync('./path/to/image.png');
const imageBase64 = imageBuffer.toString('base64');
 
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this image in detail.' },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${imageBase64}`,
            detail: 'auto',
          },
        },
      ],
    },
  ],
  stream: false,
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tokens used:', completion.usage);
```

```
import os
import base64
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
# Read the image file as base64
with open('./path/to/image.png', 'rb') as image_file:
    image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': [
                {'type': 'text', 'text': 'Describe this image in detail.'},
                {
                    'type': 'image_url',
                    'image_url': {
                        'url': f'data:image/png;base64,{image_base64}',
                        'detail': 'auto'
                    }
                }
            ]
        }
    ],
    stream=False,
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tokens used:', completion.usage)
```

### [PDF attachments](#pdf-attachments)

Send PDF documents as part of your chat completion request.

Example request

```
import fs from 'node:fs';
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// Read the PDF file as base64
const pdfBuffer = fs.readFileSync('./path/to/document.pdf');
const pdfBase64 = pdfBuffer.toString('base64');
 
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What is the main topic of this document? Please summarize the key points.',
        },
        {
          type: 'file',
          file: {
            data: pdfBase64,
            media_type: 'application/pdf',
            filename: 'document.pdf',
          },
        },
      ],
    },
  ],
  stream: false,
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tokens used:', completion.usage);
```

```
import os
import base64
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
# Read the PDF file as base64
with open('./path/to/document.pdf', 'rb') as pdf_file:
    pdf_base64 = base64.b64encode(pdf_file.read()).decode('utf-8')
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': [
                {
                    'type': 'text',
                    'text': 'What is the main topic of this document? Please summarize the key points.'
                },
                {
                    'type': 'file',
                    'file': {
                        'data': pdf_base64,
                        'media_type': 'application/pdf',
                        'filename': 'document.pdf'
                    }
                }
            ]
        }
    ],
    stream=False,
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tokens used:', completion.usage)
```

### [Tool calls](#tool-calls)

The AI Gateway supports OpenAI-compatible function calling, allowing models to call tools and functions. This follows the same specification as the [OpenAI Function Calling API](https://platform.openai.com/docs/guides/function-calling).

#### [Basic tool calls](#basic-tool-calls)

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather in a given location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g. San Francisco, CA',
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'The unit for temperature',
          },
        },
        required: ['location'],
      },
    },
  },
];
 
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: 'What is the weather like in San Francisco?',
    },
  ],
  tools: tools,
  tool_choice: 'auto',
  stream: false,
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tool calls:', completion.choices[0].message.tool_calls);
```

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
tools = [
    {
        'type': 'function',
        'function': {
            'name': 'get_weather',
            'description': 'Get the current weather in a given location',
            'parameters': {
                'type': 'object',
                'properties': {
                    'location': {
                        'type': 'string',
                        'description': 'The city and state, e.g. San Francisco, CA'
                    },
                    'unit': {
                        'type': 'string',
                        'enum': ['celsius', 'fahrenheit'],
                        'description': 'The unit for temperature'
                    }
                },
                'required': ['location']
            }
        }
    }
]
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'What is the weather like in San Francisco?'
        }
    ],
    tools=tools,
    tool_choice='auto',
    stream=False,
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tool calls:', completion.choices[0].message.tool_calls)
```

Controlling tool selection: By default, `tool_choice` is set to `'auto'`, allowing the model to decide when to use tools. You can also:

*   Set to `'none'` to disable tool calls
*   Force a specific tool with: `tool_choice: { type: 'function', function: { name: 'your_function_name' } }`

#### [Tool call response format](#tool-call-response-format)

When the model makes tool calls, the response includes tool call information:

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "anthropic/claude-sonnet-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_123",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"location\": \"San Francisco, CA\", \"unit\": \"celsius\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 82,
    "completion_tokens": 18,
    "total_tokens": 100
  }
}
```

### [Provider options](#provider-options)

The AI Gateway can route your requests across multiple AI providers for better reliability and performance. You can control which providers are used and in what order through the `providerOptions` parameter.

Example request

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// @ts-expect-error
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content:
        'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.',
    },
  ],
  stream: false,
  // Provider options for gateway routing preferences
  providerOptions: {
    gateway: {
      order: ['vertex', 'anthropic'], // Try Vertex AI first, then Anthropic
    },
  },
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tokens used:', completion.usage);
```

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.'
        }
    ],
    stream=False,
    # Provider options for gateway routing preferences
    extra_body={
        'providerOptions': {
            'gateway': {
                'order': ['vertex', 'anthropic']  # Try Vertex AI first, then Anthropic
            }
        }
    }
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tokens used:', completion.usage)
```

Provider routing: In this example, the gateway will first attempt to use Vertex AI to serve the Claude model. If Vertex AI is unavailable or fails, it will fall back to Anthropic. Other providers are still available but will only be used after the specified providers.

#### [Streaming with provider options](#streaming-with-provider-options)

Provider options work with streaming requests as well:

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// @ts-expect-error
const stream = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content:
        'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.',
    },
  ],
  stream: true,
  providerOptions: {
    gateway: {
      order: ['vertex', 'anthropic'],
    },
  },
});
 
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
stream = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.'
        }
    ],
    stream=True,
    extra_body={
        'providerOptions': {
            'gateway': {
                'order': ['vertex', 'anthropic']
            }
        }
    }
)
 
for chunk in stream:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end='', flush=True)
```

For more details about available providers and advanced provider configuration, see the [Provider Options documentation](/docs/ai-gateway/provider-options).

### [Parameters](#parameters)

The chat completions endpoint supports the following parameters:

#### [Required parameters](#required-parameters)

*   `model` (string): The model to use for the completion (e.g., `anthropic/claude-sonnet-4`)
*   `messages` (array): Array of message objects with `role` and `content` fields

#### [Optional parameters](#optional-parameters)

*   `stream` (boolean): Whether to stream the response. Defaults to `false`
*   `temperature` (number): Controls randomness in the output. Range: 0-2
*   `max_tokens` (integer): Maximum number of tokens to generate
*   `top_p` (number): Nucleus sampling parameter. Range: 0-1
*   `frequency_penalty` (number): Penalty for frequent tokens. Range: -2 to 2
*   `presence_penalty` (number): Penalty for present tokens. Range: -2 to 2
*   `stop` (string or array): Stop sequences for the generation
*   `tools` (array): Array of tool definitions for function calling
*   `tool_choice` (string or object): Controls which tools are called (`auto`, `none`, or specific function)
*   `providerOptions` (object): [Provider routing and configuration options](#provider-options)

### [Message format](#message-format)

Messages support different content types:

#### [Text messages](#text-messages)

```
{
  "role": "user",
  "content": "Hello, how are you?"
}
```

#### [Multimodal messages](#multimodal-messages)

```
{
  "role": "user",
  "content": [
    { "type": "text", "text": "What's in this image?" },
    {
      "type": "image_url",
      "image_url": {
        "url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
      }
    }
  ]
}
```

#### [File messages](#file-messages)

```
{
  "role": "user",
  "content": [
    { "type": "text", "text": "Summarize this document" },
    {
      "type": "file",
      "file": {
        "data": "JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQo...",
        "media_type": "application/pdf",
        "filename": "document.pdf"
      }
    }
  ]
}
```

## [Image generation](#image-generation)

Generate images using AI models that support multimodal output through the OpenAI-compatible API. This feature allows you to create images alongside text responses using models like Google's Gemini 2.5 Flash Image.

Endpoint

`POST /v1/chat/completions`

Parameters

To enable image generation, include the `modalities` parameter in your request:

*   `modalities` (array): Array of strings specifying the desired output modalities. Use `['text', 'image']` for both text and image generation, or `['image']` for image-only generation.

Example requests

TypeScriptPython

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const completion = await openai.chat.completions.create({
  model: 'google/gemini-2.5-flash-image-preview',
  messages: [
    {
      role: 'user',
      content:
        'Generate a beautiful sunset over mountains and describe the scene.',
    },
  ],
  // @ts-expect-error - modalities not yet in OpenAI types but supported by gateway
  modalities: ['text', 'image'],
  stream: false,
});
 
const message = completion.choices[0].message;
 
// Text content is always a string
console.log('Text:', message.content);
 
// Images are in a separate array
if (message.images && Array.isArray(message.images)) {
  console.log(`Generated ${message.images.length} images:`);
  for (const [index, img] of message.images.entries()) {
    if (img.type === 'image_url' && img.image_url) {
      console.log(`Image ${index + 1}:`, {
        size: img.image_url.url?.length || 0,
        preview: `${img.image_url.url?.substring(0, 50)}...`,
      });
    }
  }
}
```

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
completion = client.chat.completions.create(
    model='google/gemini-2.5-flash-image-preview',
    messages=[
        {
            'role': 'user',
            'content': 'Generate a beautiful sunset over mountains and describe the scene.'
        }
    ],
    # Note: modalities parameter is not yet in OpenAI Python types but supported by our gateway
    extra_body={'modalities': ['text', 'image']},
    stream=False,
)
 
message = completion.choices[0].message
 
# Text content is always a string
print(f"Text: {message.content}")
 
# Images are in a separate array
if hasattr(message, 'images') and message.images:
    print(f"Generated {len(message.images)} images:")
    for i, img in enumerate(message.images):
        if img.get('type') == 'image_url' and img.get('image_url'):
            image_url = img['image_url']['url']
            data_size = len(image_url) if image_url else 0
            print(f"Image {i+1}: size: {data_size} chars")
            print(f"Preview: {image_url[:50]}...")
 
print(f'Tokens used: {completion.usage}')
```

Response format

When image generation is enabled, the response separates text content from generated images:

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "google/gemini-2.5-flash-image-preview",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Here's a beautiful sunset scene over the mountains...",
        "images": [
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            }
          }
        ]
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 28,
    "total_tokens": 43
  }
}
```

### [Response structure details](#response-structure-details)

*   `content`: Contains the text description as a string
*   `images`: Array of generated images, each with:
    *   `type`: Always `"image_url"`
    *   `image_url.url`: Base64-encoded data URI of the generated image

### [Streaming responses](#streaming-responses)

For streaming requests, images are delivered in delta chunks:

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion.chunk",
  "created": 1677652288,
  "model": "google/gemini-2.5-flash-image-preview",
  "choices": [
    {
      "index": 0,
      "delta": {
        "images": [
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            }
          }
        ]
      },
      "finish_reason": null
    }
  ]
}
```

### [Handling streaming image responses](#handling-streaming-image-responses)

When processing streaming responses, check for both text content and images in each delta:

TypeScriptPython

```
import OpenAI from 'openai';
 
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const stream = await openai.chat.completions.create({
  model: 'google/gemini-2.5-flash-image-preview',
  messages: [{ role: 'user', content: 'Generate a sunset image' }],
  // @ts-expect-error - modalities not yet in OpenAI types
  modalities: ['text', 'image'],
  stream: true,
});
 
for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta;
 
  // Handle text content
  if (delta?.content) {
    process.stdout.write(delta.content);
  }
 
  // Handle images
  if (delta?.images) {
    for (const img of delta.images) {
      if (img.type === 'image_url' && img.image_url) {
        console.log(`\n[Image received: ${img.image_url.url.length} chars]`);
      }
    }
  }
}
```

```
import os
from openai import OpenAI
 
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
stream = client.chat.completions.create(
    model='google/gemini-2.5-flash-image-preview',
    messages=[{'role': 'user', 'content': 'Generate a sunset image'}],
    extra_body={'modalities': ['text', 'image']},
    stream=True,
)
 
for chunk in stream:
    if chunk.choices and chunk.choices[0].delta:
        delta = chunk.choices[0].delta
 
        # Handle text content
        if hasattr(delta, 'content') and delta.content:
            print(delta.content, end='', flush=True)
 
        # Handle images
        if hasattr(delta, 'images') and delta.images:
            for img in delta.images:
                if img.get('type') == 'image_url' and img.get('image_url'):
                    image_url = img['image_url']['url']
                    print(f"\n[Image received: {len(image_url)} chars]")
```

Image generation support: Currently, image generation is supported by Google's Gemini 2.5 Flash Image model. The generated images are returned as base64-encoded data URIs in the response. For more detailed information about image generation capabilities, see the [Image Generation documentation](/docs/ai-gateway/image-generation).

## [Embeddings](#embeddings)

Generate vector embeddings from input text for semantic search, similarity matching, and retrieval-augmented generation (RAG).

Endpoint

`POST /v1/embeddings`

Example request

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const response = await openai.embeddings.create({
  model: 'openai/text-embedding-3-small',
  input: 'Sunny day at the beach',
});
 
console.log(response.data[0].embedding);
```

```
import os
from openai import OpenAI
 
api_key = os.getenv("AI_GATEWAY_API_KEY") or os.getenv("VERCEL_OIDC_TOKEN")
 
client = OpenAI(
    api_key=api_key,
    base_url="https://ai-gateway.vercel.sh/v1",
)
 
response = client.embeddings.create(
    model="openai/text-embedding-3-small",
    input="Sunny day at the beach",
)
 
print(response.data[0].embedding)
```

Response format

```
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [-0.0038, 0.021, ...]
    },
  ],
  "model": "openai/text-embedding-3-small",
  "usage": {
    "prompt_tokens": 6,
    "total_tokens": 6
  },
  "providerMetadata": {
    "gateway": {
      "routing": { ... }, // Detailed routing info
      "cost": "0.00000012"
    }
  }
}
```

## [Error handling](#error-handling)

The API returns standard HTTP status codes and error responses:

### [Common error codes](#common-error-codes)

*   `400 Bad Request`: Invalid request parameters
*   `401 Unauthorized`: Invalid or missing authentication
*   `403 Forbidden`: Insufficient permissions
*   `404 Not Found`: Model or endpoint not found
*   `429 Too Many Requests`: Rate limit exceeded
*   `500 Internal Server Error`: Server error

### [Error response format](#error-response-format)

```
{
  "error": {
    "message": "Invalid request: missing required parameter 'model'",
    "type": "invalid_request_error",
    "param": "model",
    "code": "missing_parameter"
  }
}
```

## [Direct REST API usage](#direct-rest-api-usage)

If you prefer to use the AI Gateway API directly without the OpenAI client libraries, you can make HTTP requests using any HTTP client. Here are examples using `curl` and JavaScript's `fetch` API:

### [List models](#list-models)

```
curl -X GET "https://ai-gateway.vercel.sh/v1/models" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json"
```

```
const response = await fetch('https://ai-gateway.vercel.sh/v1/models', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
    'Content-Type': 'application/json',
  },
});
 
const models = await response.json();
console.log(models);
```

### [Basic chat completion](#basic-chat-completion)

```
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": "Write a one-sentence bedtime story about a unicorn."
      }
    ],
    "stream": false
  }'
```

```
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: 'Write a one-sentence bedtime story about a unicorn.',
        },
      ],
      stream: false,
    }),
  },
);
 
const result = await response.json();
console.log(result);
```

### [Streaming chat completion](#streaming-chat-completion)

```
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": "Write a one-sentence bedtime story about a unicorn."
      }
    ],
    "stream": true
  }' \
  --no-buffer
```

```
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: 'Write a one-sentence bedtime story about a unicorn.',
        },
      ],
      stream: true,
    }),
  },
);
 
const reader = response.body.getReader();
const decoder = new TextDecoder();
 
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
 
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
 
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        console.log('Stream complete');
        break;
      } else if (data.trim()) {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          process.stdout.write(content);
        }
      }
    }
  }
}
```

### [Image analysis](#image-analysis)

```
# First, convert your image to base64
IMAGE_BASE64=$(base64 -i ./path/to/image.png)
 
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "Describe this image in detail."
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,'"$IMAGE_BASE64"'",
              "detail": "auto"
            }
          }
        ]
      }
    ],
    "stream": false
  }'
```

```
import fs from 'node:fs';
 
// Read the image file as base64
const imageBuffer = fs.readFileSync('./path/to/image.png');
const imageBase64 = imageBuffer.toString('base64');
 
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image in detail.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
                detail: 'auto',
              },
            },
          ],
        },
      ],
      stream: false,
    }),
  },
);
 
const result = await response.json();
console.log(result);
```

### [Tool calls](#tool-calls)

```
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": "What is the weather like in San Francisco?"
      }
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "Get the current weather in a given location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA"
              },
              "unit": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"],
                "description": "The unit for temperature"
              }
            },
            "required": ["location"]
          }
        }
      }
    ],
    "tool_choice": "auto",
    "stream": false
  }'
```

```
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: 'What is the weather like in San Francisco?',
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get the current weather in a given location',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state, e.g. San Francisco, CA',
                },
                unit: {
                  type: 'string',
                  enum: ['celsius', 'fahrenheit'],
                  description: 'The unit for temperature',
                },
              },
              required: ['location'],
            },
          },
        },
      ],
      tool_choice: 'auto',
      stream: false,
    }),
  },
);
 
const result = await response.json();
console.log(result);
```

### [Provider options](#provider-options)

```
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": "Tell me the history of the San Francisco Mission-style burrito in two paragraphs."
      }
    ],
    "stream": false,
    "providerOptions": {
      "gateway": {
        "order": ["vertex", "anthropic"]
      }
    }
  }'
```

```
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content:
            'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.',
        },
      ],
      stream: false,
      providerOptions: {
        gateway: {
          order: ['vertex', 'anthropic'], // Try Vertex AI first, then Anthropic
        },
      },
    }),
  },
);
 
const result = await response.json();
console.log(result);
```
# Models & Providers

The AI Gateway's unified API is built to be flexible, allowing you to switch between [different AI models](https://vercel.com/ai-gateway/models) and providers without rewriting parts of your application. This is useful for testing different models or when you want to change the underlying AI provider for cost or performance reasons.

To view the list of supported models and providers, check out the [AI Gateway models page](https://vercel.com/ai-gateway/models).

### [What are models and providers?](#what-are-models-and-providers)

Models are AI algorithms that process your input data to generate responses, such as [Grok](https://docs.x.ai/docs/models), [GPT-4o](https://platform.openai.com/docs/models/gpt-4o), or [Claude Sonnet 4](https://www.anthropic.com/claude/sonnet). Providers are the companies or services that host these models, such as [xAI](https://x.ai), [OpenAI](https://openai.com), or [Anthropic](https://anthropic.com).

In some cases, multiple providers, including the model creator, host the same model. For example, you can use the `xai/grok-4` model from [xAI](https://x.ai/) or the `openai/gpt-4o` model from [OpenAI](https://openai.com), following the format `creator/model-name`.

Different providers may have different specifications for the same model such as different pricing and performance. You can choose the one that best fits your needs.

You can view the list of supported models and providers by following these steps:

1.  Go to the AI Gateway tab in your Vercel dashboard.
2.  Click on the Model List section on the left sidebar.

### [Specifying the model](#specifying-the-model)

There are two ways to specify the model and provider to use for an AI Gateway request:

*   [As part of an AI SDK function call](#as-part-of-an-ai-sdk-function-call)
*   [Globally for all requests in your application](#globally-for-all-requests-in-your-application)

#### [As part of an AI SDK function call](#as-part-of-an-ai-sdk-function-call)

In the AI SDK, you can specify the model and provider directly in your API calls using either plain strings or the AI Gateway provider. This allows you to switch models or providers for specific requests without affecting the rest of your application.

To use AI Gateway, specify a model and provider via a plain string, for example:

```
import { generateText } from 'ai';
import { NextRequest } from 'next/server';
 
export async function GET() {
  const result = await generateText({
    model: 'xai/grok-3',
    prompt: 'Tell me the history of the San Francisco Mission-style burrito.',
  });
  return Response.json(result);
}
```

We have set the `xai/grok-3` model from xAI as the default. You can change the model to any other supported model by changing the string specified as the value for the `model` parameter.

You can test different models by changing the `model` parameter and opening your browser to `http://localhost:3000/api/chat`.

You can also use a provider instance. This can be useful if you'd like to specify custom [provider options](/docs/ai-gateway/provider-options), or if you'd like to use a Gateway provider with the AI SDK [Provider Registry](https://v5.ai-sdk.dev/docs/ai-sdk-core/provider-management#provider-registry).

Install the `@ai-sdk/gateway` package directly as a dependency in your project.

```
pnpm install @ai-sdk/gateway
```

You can change the model by changing the string passed to `gateway()`.

```
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { NextRequest } from 'next/server';
 
export async function GET() {
  const result = await generateText({
    model: gateway('xai/grok-3'),
    prompt: 'Tell me the history of the San Francisco Mission-style burrito.',
  });
  return Response.json(result);
}
```

The example above uses the default `gateway` provider instance. You can also create a custom provider instance to use in your application. Creating a custom instance is useful when you need to specify a different environment variable for your API key, or when you need to set a custom base URL (for example, if you're working behind a corporate proxy server).

```
import { generateText } from 'ai';
import { createGateway } from '@ai-sdk/gateway';
 
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY, // the default environment variable for the API key
  baseURL: 'https://ai-gateway.vercel.sh/v1/ai', // the default base URL
});
 
export async function GET() {
  const result = await generateText({
    model: gateway('xai/grok-3'),
    prompt: 'Why is the sky blue?',
  });
  return Response.json(result);
}
```

#### [Globally for all requests in your application](#globally-for-all-requests-in-your-application)

The Vercel AI Gateway is the default provider for the AI SDK when a model is specified as a string. You can set a different provider as the default by assigning the provider instance to the `globalThis.AI_SDK_DEFAULT_PROVIDER` variable.

This is intended to be done in a file that runs before any other AI SDK calls. In the case of a Next.js application, you can do this in [`instrumentation.ts`](https://nextjs.org/docs/app/guides/instrumentation):

```
import { openai } from '@ai-sdk/openai';
 
export async function register() {
  // This runs once when the Node.js runtime starts
  globalThis.AI_SDK_DEFAULT_PROVIDER = openai;
 
  // You can also do other initialization here
  console.log('App initialization complete');
}
```

Then, you can use the `generateText` function without specifying the provider in each call.

```
import { generateText } from 'ai';
import { NextRequest } from 'next/server';
 
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get('prompt');
 
  if (!prompt) {
    return Response.json({ error: 'Prompt is required' }, { status: 400 });
  }
 
  const result = await generateText({
    model: 'gpt-4o',
    prompt,
  });
 
  return Response.json(result);
}
```

### [Embedding models](#embedding-models)

Generate vector embeddings for semantic search, similarity matching, and retrieval-augmented generation (RAG).

#### [Single value](#single-value)

```
import { embed } from 'ai';
 
export async function GET() {
  const result = await embed({
    model: 'openai/text-embedding-3-small',
    value: 'Sunny day at the beach',
  });
 
  return Response.json(result);
}
```

#### [Multiple values](#multiple-values)

```
import { embedMany } from 'ai';
 
export async function GET() {
  const result = await embedMany({
    model: 'openai/text-embedding-3-small',
    values: ['Sunny day at the beach', 'Cloudy city skyline'],
  });
 
  return Response.json(result);
}
```

#### [Gateway provider instance](#gateway-provider-instance)

Alternatively, if you're using the Gateway provider instance, specify embedding models with `gateway.textEmbeddingModel(...)`.

```
import { embed } from 'ai';
import { gateway } from '@ai-sdk/gateway';
 
export async function GET() {
  const result = await embed({
    model: gateway.textEmbeddingModel('openai/text-embedding-3-small'),
    value: 'Sunny day at the beach',
  });
 
  return Response.json(result);
}
```

### [Dynamic model discovery](#dynamic-model-discovery)

The `getAvailableModels` function retrieves detailed information about all models configured for the `gateway` provider, including each model's `id`, `name`, `description`, and `pricing` details.

```
import { gateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';
 
const availableModels = await gateway.getAvailableModels();
 
availableModels.models.forEach((model) => {
  console.log(`${model.id}: ${model.name}`);
  if (model.description) {
    console.log(`  Description: ${model.description}`);
  }
  if (model.pricing) {
    console.log(`  Input: $${model.pricing.input}/token`);
    console.log(`  Output: $${model.pricing.output}/token`);
    if (model.pricing.cachedInputTokens) {
      console.log(
        `  Cached input (read): $${model.pricing.cachedInputTokens}/token`,
      );
    }
    if (model.pricing.cacheCreationInputTokens) {
      console.log(
        `  Cache creation (write): $${model.pricing.cacheCreationInputTokens}/token`,
      );
    }
  }
});
 
const { text } = await generateText({
  model: availableModels.models[0].id, // e.g., 'openai/gpt-4o'
  prompt: 'Hello world',
});
```

#### [Filtering models by type](#filtering-models-by-type)

You can filter the available models by their type (e.g., to separate language models from embedding models) using the `modelType` property:

```
import { gateway } from '@ai-sdk/gateway';
 
const { models } = await gateway.getAvailableModels();
const textModels = models.filter((m) => m.modelType === 'language');
const embeddingModels = models.filter((m) => m.modelType === 'embedding');
 
console.log(
  'Language models:',
  textModels.map((m) => m.id),
);
console.log(
  'Embedding models:',
  embeddingModels.map((m) => m.id),
);
```
# Image Generation

AI Gateway supports image generation and editing capabilities. You can generate new images from text prompts, edit existing images, and create variations with natural language instructions.

You can view all available models that support image generation by using the Image filter at the [AI Gateway Models page](https://vercel.com/ai-gateway/models).

## [Google Gemini 2.5 Flash Image](#google-gemini-2.5-flash-image)

Google's [Gemini 2.5 Flash Image model](https://developers.googleblog.com/en/introducing-gemini-2-5-flash-image/) offers state-of-the-art image generation and editing capabilities. This model supports [specifying response modalities](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai#image-outputs) to enable image outputs alongside text responses.

You can find details on this model in the [Model Library](https://vercel.com/ai-gateway/models/gemini-2.5-flash-image-preview).

## [Basic image generation](#basic-image-generation)

Generate images from text prompts using the `generateText` function with appropriate provider options:

TypeScript (generateText)TypeScript (streamText)TypeScript (Chatbot)

```
import 'dotenv/config';
import { generateText } from 'ai';
import fs from 'node:fs';
import path from 'node:path';
 
async function main() {
  const result = await generateText({
    model: 'google/gemini-2.5-flash-image-preview',
    providerOptions: {
      google: { responseModalities: ['TEXT', 'IMAGE'] },
    },
    prompt:
      'Render two versions of a pond tortoise sleeping on a log in a lake at sunset.',
  });
 
  if (result.text) {
    console.log(result.text);
  }
 
  // Save generated images to local filesystem
  const imageFiles = result.files.filter((f) =>
    f.mediaType?.startsWith('image/'),
  );
 
  if (imageFiles.length > 0) {
    // Create output directory if it doesn't exist
    const outputDir = 'output';
    fs.mkdirSync(outputDir, { recursive: true });
 
    const timestamp = Date.now();
 
    for (const [index, file] of imageFiles.entries()) {
      const extension = file.mediaType?.split('/')[1] || 'png';
      const filename = `image-${timestamp}-${index}.${extension}`;
      const filepath = path.join(outputDir, filename);
 
      await fs.promises.writeFile(filepath, file.uint8Array);
      console.log(`Saved image to ${filepath}`);
    }
  }
 
  console.log();
  console.log('Usage: ', JSON.stringify(result.usage, null, 2));
  console.log(
    'Provider metadata: ',
    JSON.stringify(result.providerMetadata, null, 2),
  );
}
 
main().catch(console.error);
```

```
import 'dotenv/config';
import { streamText } from 'ai';
import fs from 'node:fs';
import path from 'node:path';
 
async function main() {
  const result = streamText({
    model: 'google/gemini-2.5-flash-image-preview',
    providerOptions: {
      google: { responseModalities: ['TEXT', 'IMAGE'] },
    },
    prompt: 'Render a pond tortoise sleeping on a log in a lake at sunset.',
  });
 
  // Create output directory if it doesn't exist
  const outputDir = 'output';
  fs.mkdirSync(outputDir, { recursive: true });
  const timestamp = Date.now();
  let imageIndex = 0;
 
  for await (const delta of result.fullStream) {
    switch (delta.type) {
      case 'text-delta': {
        process.stdout.write(delta.text);
        break;
      }
 
      case 'file': {
        if (delta.file.mediaType.startsWith('image/')) {
          console.log();
 
          const extension = delta.file.mediaType?.split('/')[1] || 'png';
          const filename = `image-${timestamp}-${imageIndex}.${extension}`;
          const filepath = path.join(outputDir, filename);
 
          await fs.promises.writeFile(filepath, delta.file.uint8Array);
          console.log(`Saved image to ${filepath}`);
          imageIndex++;
        }
        break;
      }
    }
  }
  process.stdout.write('\n\n');
 
  console.log();
  console.log('Finish reason: ', result.finishReason);
  console.log('Usage: ', JSON.stringify(await result.usage, null, 2));
  console.log(
    'Provider metadata: ',
    JSON.stringify(await result.providerMetadata, null, 2),
  );
}
 
main().catch(console.error);
```

```
import { type ModelMessage, streamText } from 'ai';
import 'dotenv/config';
import * as readline from 'node:readline/promises';
import fs from 'node:fs';
import path from 'node:path';
 
const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
 
const messages: ModelMessage[] = [];
 
async function main() {
  // Create output directory if it doesn't exist
  const outputDir = 'output';
  fs.mkdirSync(outputDir, { recursive: true });
 
  while (true) {
    messages.push({ role: 'user', content: await terminal.question('You: ') });
 
    const result = streamText({
      model: 'google/gemini-2.5-flash-image-preview',
      providerOptions: {
        google: { responseModalities: ['TEXT', 'IMAGE'] },
      },
      messages,
    });
 
    process.stdout.write('\nAssistant: ');
    const timestamp = Date.now();
    let imageIndex = 0;
 
    for await (const delta of result.fullStream) {
      switch (delta.type) {
        case 'text-delta': {
          process.stdout.write(delta.text);
          break;
        }
 
        case 'file': {
          if (delta.file.mediaType.startsWith('image/')) {
            console.log();
 
            const extension = delta.file.mediaType?.split('/')[1] || 'png';
            const filename = `chat-image-${timestamp}-${imageIndex}.${extension}`;
            const filepath = path.join(outputDir, filename);
 
            await fs.promises.writeFile(filepath, delta.file.uint8Array);
            console.log(`💾 Saved image to ${filepath}`);
            imageIndex++;
          }
          break;
        }
      }
    }
    process.stdout.write('\n\n');
 
    console.log('Usage: ', JSON.stringify(await result.usage, null, 2));
    console.log(
      'Provider metadata: ',
      JSON.stringify(await result.providerMetadata, null, 2),
    );
 
    messages.push(...(await result.response).messages);
  }
}
 
main().catch(console.error);
```

Check the [AI SDK provider documentation](https://ai-sdk.dev/providers/ai-sdk-providers) for more on provider/model-specific image generation configuration.

For OpenAI-compatible API usage with image generation, see the [OpenAI-Compatible API Image Generation section](/docs/ai-gateway/openai-compat#image-generation).

## [OpenAI-compatible API response format](#openai-compatible-api-response-format)

When using the OpenAI-compatible API (`/v1/chat/completions`) for image generation, responses follow a specific format that separates text content from generated images:

### [Response structure](#response-structure)

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "google/gemini-2.5-flash-image-preview",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I've generated a beautiful sunset image for you.",
        "images": [
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
            }
          }
        ]
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 28,
    "total_tokens": 43
  }
}
```

### [Key format details](#key-format-details)

*   `content`: Contains the text description as a string
*   `images`: Array of generated images, each with:
    *   `type`: Always `"image_url"`
    *   `image_url.url`: Base64-encoded data URI of the generated image

### [Streaming responses](#streaming-responses)

For streaming requests, images are delivered in delta chunks:

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion.chunk",
  "created": 1677652288,
  "model": "google/gemini-2.5-flash-image-preview",
  "choices": [
    {
      "index": 0,
      "delta": {
        "images": [
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
            }
          }
        ]
      },
      "finish_reason": null
    }
  ]
}
```

## [Handling generated images](#handling-generated-images)

Generated images are returned as `GeneratedFile` objects in the `result.files` array. Each contains:

*   `base64`: The file as a base 64 data string
*   `uint8Array`: The file as a `Uint8Array`
*   `mediaType`: The MIME type (e.g., `image/png`, `image/jpeg`)

## [Streaming image generation](#streaming-image-generation)

When using `streamText`, images are delivered through `fullStream` as `file` events:

```
for await (const delta of result.fullStream) {
  switch (delta.type) {
    case 'text-delta':
      // Handle text chunks
      process.stdout.write(delta.text);
      break;
 
    case 'file':
      // Handle generated files (images)
      if (delta.file.mediaType.startsWith('image/')) {
        await saveImage(delta.file);
      }
      break;
  }
}
```

# Generate Text with Image Prompt

Some language models that support vision capabilities accept images as part of the prompt. Here are some of the different [formats](/docs/reference/ai-sdk-core/generate-text#content-image) you can use to include images as input.

## URL

```ts file='index.ts'
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await generateText({
  model: openai('gpt-4.1'),
  maxOutputTokens: 512,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'what are the red things in this image?',
        },
        {
          type: 'image',
          image: new URL(
            'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/2024_Solar_Eclipse_Prominences.jpg/720px-2024_Solar_Eclipse_Prominences.jpg',
          ),
        },
      ],
    },
  ],
});

console.log(result);
```

## File Buffer

```ts file='index.ts'
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import fs from 'fs';

const result = await generateText({
  model: openai('gpt-4.1'),
  maxOutputTokens: 512,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'what are the red things in this image?',
        },
        {
          type: 'image',
          image: fs.readFileSync('./node/attachments/eclipse.jpg', {
            encoding: 'base64',
          }),
        },
      ],
    },
  ],
});

console.log(result);
```

# Stream Text with Image Prompt

Vision-language models can analyze images alongside text prompts to generate responses about visual content. This multimodal approach allows for rich interactions where you can ask questions about images, request descriptions, or analyze visual details. The combination of image and text inputs enables more sophisticated AI applications like visual question answering and image analysis.

```ts
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import 'dotenv/config';
import fs from 'node:fs';

async function main() {
  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20240620'),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe the image in detail.' },
          { type: 'image', image: fs.readFileSync('./data/comic-cat.png') },
        ],
      },
    ],
  });

  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }
}

main().catch(console.error);
```

# Stream Object with Image Prompt

Some language models that support vision capabilities accept images as part of the prompt. Here are some of the different [formats](/docs/reference/ai-sdk-core/generate-text#content-image) you can use to include images as input.

## URL

```ts file='index.ts'
import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

async function main() {
  const { partialObjectStream } = streamObject({
    model: openai('gpt-4.1'),
    maxOutputTokens: 512,
    schema: z.object({
      stamps: z.array(
        z.object({
          country: z.string(),
          date: z.string(),
        }),
      ),
    }),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'list all the stamps in these passport pages?',
          },
          {
            type: 'image',
            image: new URL(
              'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/WW2_Spanish_official_passport.jpg/1498px-WW2_Spanish_official_passport.jpg',
            ),
          },
        ],
      },
    ],
  });

  for await (const partialObject of partialObjectStream) {
    console.clear();
    console.log(partialObject);
  }
}

main();
```

## File Buffer

```ts file='index.ts'
import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import dotenv from 'dotenv';
import { z } from 'zod';
import fs from 'fs';

dotenv.config();

async function main() {
  const { partialObjectStream } = streamObject({
    model: openai('gpt-4.1'),
    maxOutputTokens: 512,
    schema: z.object({
      stamps: z.array(
        z.object({
          country: z.string(),
          date: z.string(),
        }),
      ),
    }),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'list all the stamps in these passport pages?',
          },
          {
            type: 'image',
            image: fs.readFileSync('./data/passport.png', {
              encoding: 'base64',
            }),
          },
        ],
      },
    ],
  });

  for await (const partialObject of partialObjectStream) {
    console.clear();
    console.log(partialObject);
  }
}

main();
```

# Call Tools with Image Prompt

Some language models that support vision capabilities accept images as part of the prompt. Here are some of the different [formats](/docs/reference/ai-sdk-core/generate-text#content-image) you can use to include images as input.

```ts
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const result = await generateText({
  model: openai('gpt-4.1'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'can you log this meal for me?' },
        {
          type: 'image',
          image: new URL(
            'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Cheeseburger_%2817237580619%29.jpg/640px-Cheeseburger_%2817237580619%29.jpg',
          ),
        },
      ],
    },
  ],
  tools: {
    logFood: tool({
      description: 'Log a food item',
      inputSchema: z.object({
        name: z.string(),
        calories: z.number(),
      }),
      execute({ name, calories }) {
        storeInDatabase({ name, calories }); // your implementation here
      },
    }),
  },
});
```
