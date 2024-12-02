'use client'

import React, { useEffect, useState } from 'react'
import { PartialInquiry } from '@/lib/schema/inquiry'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { ArrowRight, Check, FastForward, Sparkles } from 'lucide-react'
import { ChatRequestOptions, CreateMessage, Message } from 'ai'

export type CopilotProps = {
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  inquiry?: PartialInquiry
}

export const Copilot: React.FC<CopilotProps> = ({ append, inquiry }: CopilotProps) => {
  const [completed, setCompleted] = useState(false)
  const [query, setQuery] = useState('')
  const [skipped, setSkipped] = useState(false)
  const [checkedOptions, setCheckedOptions] = useState<{
    [key: string]: boolean
  }>({})
  const [isButtonDisabled, setIsButtonDisabled] = useState(true)

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
    checkIfButtonShouldBeEnabled()
  }

  const handleOptionChange = (selectedOption: string) => {
    const updatedCheckedOptions = {
      ...checkedOptions,
      [selectedOption]: !checkedOptions[selectedOption]
    }
    setCheckedOptions(updatedCheckedOptions)
    checkIfButtonShouldBeEnabled(updatedCheckedOptions)
  }

  const checkIfButtonShouldBeEnabled = (currentOptions = checkedOptions) => {
    const anyCheckboxChecked = Object.values(currentOptions).some(
      checked => checked
    )
    setIsButtonDisabled(!(anyCheckboxChecked || query))
  }

  const updatedQuery = () => {
    const selectedOptions = Object.entries(checkedOptions)
      .filter(([, checked]) => checked)
      .map(([option]) => option)
    return [...selectedOptions, query].filter(Boolean).join(', ')
  }

  useEffect(() => {
    checkIfButtonShouldBeEnabled()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const onFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    skip?: boolean
  ) => {
    e.preventDefault()

    // setCompleted(true)
    // setSkipped(skip || false)

    // Always create FormData
    const formData = new FormData()

    // Add model information

    // If not skipping, add form data from the event
    if (!skip) {
      const form = e.target as HTMLFormElement
      const formEntries = Array.from(new FormData(form).entries());
      formEntries.forEach(([key, value]) => {
        if (key !== 'model') {
          // Don't override model
          formData.append(key, value)
        }
      })
    }

    const fields: { [key: string]: string } = {};
    formData.forEach((value, key) => {
      fields[key] = value as string;
    });
    
    // Construct the AI-friendly prompt
    const additionalQuery = fields['additional_query'];
    delete fields['additional_query'];
    
    const optionalFields = Object.entries(fields)
      .map(([key, value]) => `${key}`)
      .join(', ');
    
      const prompt = `${optionalFields}${additionalQuery.trim().length ? `, and ${additionalQuery}` : ''}`;
    
    append({
      role: 'user',
      content: prompt,
    });
  }

  const handleSkip = (e: React.MouseEvent<HTMLButtonElement>) => {
    append({
      role: 'user',
      content: 'Skip inquiring more information'
    })
  }

  // if (error) {
  //   return (
  //     <Card className="p-4 w-full flex justify-between items-center">
  //       <div className="flex items-center space-x-2">
  //         <Sparkles className="size-4" />
  //         <h5 className="text-muted-foreground text-xs truncate">
  //           {`error: ${error}`}
  //         </h5>
  //       </div>
  //     </Card>
  //   )
  // }

  if (skipped) {
    return null
  }

  if (completed) {
    return (
      <Card className="p-3 md:p-4 w-full flex justify-between items-center">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <h5 className="text-muted-foreground text-xs truncate">
            {updatedQuery()}
          </h5>
        </div>
        <Check size={16} className="text-green-500 size-4" />
      </Card>
    )
  } else {
    return (
      <Card className="p-4 rounded-lg w-full mx-auto">
        <div className="mb-4">
          <p className="text-lg text-foreground text-semibold ml-2">
            {inquiry?.question}
          </p>
        </div>
        <form onSubmit={onFormSubmit}>
          <div className="flex flex-wrap justify-start mb-4">
            {inquiry?.options?.map((option, index) => (
              <div
                key={`option-${index}`}
                className="flex items-center space-x-1.5 mb-2"
              >
                <Checkbox
                  id={option?.value}
                  name={option?.label}
                  onCheckedChange={() =>
                    handleOptionChange(option?.label as string)
                  }
                />
                <label
                  className="text-sm whitespace-nowrap pr-4"
                  htmlFor={option?.value}
                >
                  {option?.label}
                </label>
              </div>
            ))}
          </div>
          {inquiry?.allowsInput && (
            <div className="mb-6 flex flex-col space-y-2 text-sm">
              <label className="text-muted-foreground" htmlFor="query">
                {inquiry?.inputLabel}
              </label>
              <Input
                type="text"
                name="additional_query"
                className="w-full"
                id="query"
                placeholder={inquiry?.inputPlaceholder}
                value={query}
                onChange={handleInputChange}
              />
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              // disabled={pending || isGenerating}
            >
              <FastForward size={16} className="mr-1" />
              Skip
            </Button>
            <Button type="submit" disabled={isButtonDisabled}>
              <ArrowRight size={16} className="mr-1" />
              Send
            </Button>
          </div>
        </form>
      </Card>
    )
  }
}
