'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tag, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TagItem {
  id: string;
  name: string;
  deviceCount: number;
  dateCreated: string;
}

export default function TagManagerPage() {
  const [newTagName, setNewTagName] = useState('');
  const [tags, setTags] = useState<TagItem[]>([
    {
      id: '1',
      name: 'Windows 11',
      deviceCount: 45,
      dateCreated: '2023-10-12'
    },
    {
      id: '2',
      name: 'Finance Dept',
      deviceCount: 12,
      dateCreated: '2023-09-15'
    },
    {
      id: '3',
      name: 'Critical Assets',
      deviceCount: 8,
      dateCreated: '2023-11-02'
    },
    {
      id: '4',
      name: 'Remote Devices',
      deviceCount: 27,
      dateCreated: '2023-08-30'
    }
  ]);

  const handleAddTag = () => {
    if (!newTagName) {
      toast.error('Please enter a tag name');
      return;
    }

    if (tags.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
      toast.error('A tag with this name already exists');
      return;
    }

    const newTag: TagItem = {
      id: Date.now().toString(),
      name: newTagName,
      deviceCount: 0,
      dateCreated: new Date().toISOString().split('T')[0]
    };

    setTags([...tags, newTag]);
    setNewTagName('');
    toast.success(`Tag "${newTagName}" created successfully`);
  };

  const handleDeleteTag = (id: string) => {
    const tagToDelete = tags.find(tag => tag.id === id);
    if (tagToDelete && tagToDelete.deviceCount > 0) {
      toast.error(`Cannot delete tag "${tagToDelete.name}" as it is assigned to ${tagToDelete.deviceCount} devices`);
      return;
    }

    setTags(tags.filter(tag => tag.id !== id));
    toast.success('Tag deleted successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Tag Manager</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tag className="mr-2 h-4 w-4" />
            Manage Tags
          </CardTitle>
          <CardDescription>
            Create and manage tags to organize your devices and assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-6">
            <Input 
              placeholder="Enter new tag name" 
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleAddTag} className="flex items-center">
              <Plus className="mr-2 h-4 w-4" /> Add Tag
            </Button>
          </div>

          <Table>
            <TableCaption>A list of your tags.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Tag Name</TableHead>
                <TableHead>Devices</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell>{tag.deviceCount}</TableCell>
                  <TableCell>{tag.dateCreated}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteTag(tag.id)}
                      disabled={tag.deviceCount > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {tags.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No tags yet. Create your first tag above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 