"use client";

import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";

export default function ContactSection() {
  return (
    <div className="w-full">
      <div className="bbh-bartle-regular mb-10 text-[clamp(28px,3.5vw,44px)]">
        Contact
      </div>

      <Panel magnetStrength={1.6} className="max-w-[720px] p-6">
        <div className="label mb-4">Send a message</div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input placeholder="Name" />
          <Input placeholder="Email" />
          <div className="md:col-span-2">
            <Input placeholder="What are you building?" />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="mono text-[12px] text-white/45">
            Expect a response within 1-2 business days.
          </div>
          <Button className="glow">Send</Button>
        </div>
      </Panel>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button className="flex items-center gap-2">
          <Github size={16} /> GitHub
        </Button>
        <Button className="flex items-center gap-2">
          <Twitter size={16} /> X
        </Button>
        <Button className="flex items-center gap-2">
          <Linkedin size={16} /> LinkedIn
        </Button>
        <Button className="flex items-center gap-2">
          <Mail size={16} /> Email
        </Button>
      </div>
    </div>
  );
}
