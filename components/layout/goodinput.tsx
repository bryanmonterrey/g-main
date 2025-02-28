"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputAction,
  PromptInputActions,
} from "@/components/ui/prompt-input";
import { ArrowUp, Square, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AGENT_MODES } from "@/components/chat/ModeSelector";
import { DropdownComp } from "@/components/chat/WalletSelector";

export const MOCK_MODELS = [
  {
    name: "Claude",
    subTxt: "Claude 3.5 Sonnet",
  },
  {
    name: "OpenAI",
    subTxt: "GPT-4o-mini",
  },
  {
    name: "DeepSeek",
    subTxt: "DeepSeek-V3 Base",
  }
];

type Item = {
  name: string;
  subTxt: string;
};

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent, selectedModel: Item) => void;
  selectedMode: (typeof AGENT_MODES)[0];
  setSelectedMode: (mode: (typeof AGENT_MODES)[0]) => void;
  selectedModel: Item;
  setSelectedModel: (model: Item) => void;
  selectedWallet: Item;
  setSelectedWallet: (wallet: Item) => void;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  selectedMode,
  setSelectedMode,
  selectedModel,
  setSelectedModel,
  selectedWallet,
  setSelectedWallet,
}: ChatInputProps) {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [wallets, setWallets] = useState([{
    name: "Default Agent Wallet",
    subTxt: "",
  }]);

  useEffect(() => {
    fetch("/api/wallet")
      .then((res) => res.json())
      .then((data) => {
        setWallets(data.wallets);
      });
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (input.trim() || files.length > 0) {
      onSubmit(e || new Event('submit') as any, selectedModel);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <PromptInput
      value={input}
      onValueChange={setInput}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      className="w-full"
    >
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg bg-secondary/5 px-3 py-2 text-sm"
            >
              <Paperclip className="size-4 text-white/90" strokeWidth={1.5}/>
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(index)}
                className="rounded-full p-1 bg-secondary/5 hover:bg-secondary/5"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <PromptInputTextarea 
        placeholder="Ask anything..." 
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) {
              handleSubmit();
            }
          }
        }}
      />

      <PromptInputActions className="flex items-center justify-between my-auto">
        <div className="flex items-center justify-center">
        <PromptInputAction tooltip="Attach files">
          <label
            htmlFor="file-upload"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl bg-secondary/5 hover:bg-secondary/5 border-white/5 border"
          >
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <Paperclip className="h-5 w-5 text-white/90" />
          </label>
        </PromptInputAction>
        <div className="flex items-center justify-center">
        <div className="flex items-center justify-center overflow-x-auto scrollbar-none">
          <div className="flex items-center min-w-fit gap-x-1">
            <DropdownComp selectedItems={selectedModel} onItemsChange={setSelectedModel} items={MOCK_MODELS} />
            <DropdownComp selectedItems={selectedWallet} onItemsChange={setSelectedWallet} items={wallets} />
          </div>
        </div>
      </div>
      </div>

        <PromptInputAction tooltip="Send message">
          <Button
            variant="default"
            size="icon"
            className="h-8 w-8 rounded-full bg-primary/5 border border-white/5"
            onClick={() => handleSubmit()}
            disabled={!input.trim() && files.length === 0}
          >
            <ArrowUp className="size-5" />
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}