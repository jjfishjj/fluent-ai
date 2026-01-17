import { useState } from 'react';
import { Conversation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  Star, 
  AlertTriangle, 
  FileText,
  Trash2 
} from 'lucide-react';
import { format } from 'date-fns';

interface ConversationTableProps {
  conversations: Conversation[];
  onViewConversation: (id: string) => void;
  onMarkAsQuality: (id: string) => void;
  onMarkAsError: (id: string) => void;
  onCreatePreset: (id: string) => void;
}

export function ConversationTable({
  conversations,
  onViewConversation,
  onMarkAsQuality,
  onMarkAsError,
  onCreatePreset,
}: ConversationTableProps) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>ID</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Scenario</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Messages</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.map((conv) => (
            <TableRow key={conv.id} className="hover:bg-muted/30">
              <TableCell className="font-mono text-sm">
                {conv.id.slice(0, 8)}...
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {conv.settings.language}
                </Badge>
              </TableCell>
              <TableCell className="capitalize">
                {conv.settings.scenario}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={
                    conv.settings.difficulty === 'beginner' ? 'secondary' :
                    conv.settings.difficulty === 'intermediate' ? 'default' : 
                    'destructive'
                  }
                  className="capitalize"
                >
                  {conv.settings.difficulty}
                </Badge>
              </TableCell>
              <TableCell>{conv.messages.length}</TableCell>
              <TableCell className="text-muted-foreground">
                {format(conv.startedAt, 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewConversation(conv.id)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onMarkAsQuality(conv.id)}>
                      <Star className="w-4 h-4 mr-2 text-warning" />
                      Mark as Quality
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMarkAsError(conv.id)}>
                      <AlertTriangle className="w-4 h-4 mr-2 text-destructive" />
                      Mark as Error Example
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onCreatePreset(conv.id)}>
                      <FileText className="w-4 h-4 mr-2 text-primary" />
                      Create Preset
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
