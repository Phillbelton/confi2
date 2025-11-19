'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronRight, ChevronDown, FolderClosed, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CategoryWithSubcategories } from '@/lib/categoryUtils';

interface HierarchicalCategoryFilterProps {
  categories: CategoryWithSubcategories[];
  selectedCategories: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function HierarchicalCategoryFilter({
  categories,
  selectedCategories,
  onSelectionChange,
}: HierarchicalCategoryFilterProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Auto-expand categories that have selected subcategories
  useEffect(() => {
    const newExpanded = new Set(expandedCategories);
    categories.forEach((parent) => {
      if (parent.subcategories && parent.subcategories.length > 0) {
        const hasSelectedChild = parent.subcategories.some((sub) =>
          selectedCategories.includes(sub._id)
        );
        if (hasSelectedChild) {
          newExpanded.add(parent._id);
        }
      }
    });
    setExpandedCategories(newExpanded);
  }, [selectedCategories, categories]);

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Get checkbox state for a parent category
  const getParentCheckboxState = (parent: CategoryWithSubcategories): 'checked' | 'indeterminate' | 'unchecked' => {
    if (!parent.subcategories || parent.subcategories.length === 0) {
      return selectedCategories.includes(parent._id) ? 'checked' : 'unchecked';
    }

    const childIds = parent.subcategories.map((sub) => sub._id);
    const selectedChildCount = childIds.filter((id) =>
      selectedCategories.includes(id)
    ).length;

    if (selectedChildCount === 0) {
      return 'unchecked';
    } else if (selectedChildCount === childIds.length) {
      return 'checked';
    } else {
      return 'indeterminate';
    }
  };

  // Handle parent category click
  const handleParentToggle = (parent: CategoryWithSubcategories) => {
    if (!parent.subcategories || parent.subcategories.length === 0) {
      // No children, simple toggle
      const newSelection = selectedCategories.includes(parent._id)
        ? selectedCategories.filter((id) => id !== parent._id)
        : [...selectedCategories, parent._id];
      onSelectionChange(newSelection);
      return;
    }

    const state = getParentCheckboxState(parent);
    const childIds = parent.subcategories.map((sub) => sub._id);

    if (state === 'checked') {
      // Uncheck all children
      const newSelection = selectedCategories.filter(
        (id) => !childIds.includes(id)
      );
      onSelectionChange(newSelection);
    } else {
      // Check all children (works for both unchecked and indeterminate)
      const newSelection = [
        ...selectedCategories.filter((id) => !childIds.includes(id)),
        ...childIds,
      ];
      onSelectionChange(newSelection);
    }
  };

  // Handle child category click
  const handleChildToggle = (childId: string) => {
    const newSelection = selectedCategories.includes(childId)
      ? selectedCategories.filter((id) => id !== childId)
      : [...selectedCategories, childId];
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-2">
      {categories.map((parent) => {
        const hasChildren =
          parent.subcategories && parent.subcategories.length > 0;
        const isExpanded = expandedCategories.has(parent._id);
        const parentState = getParentCheckboxState(parent);

        return (
          <div key={parent._id} className="space-y-1">
            {/* Parent Category */}
            <div className="flex items-center space-x-2">
              {/* Expand/Collapse Button */}
              {hasChildren && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-transparent"
                  onClick={() => toggleExpand(parent._id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
              {!hasChildren && <div className="w-5" />}

              {/* Folder Icon */}
              <FolderClosed className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

              {/* Checkbox */}
              <Checkbox
                id={`cat-${parent._id}`}
                checked={parentState === 'checked'}
                // @ts-ignore - indeterminate is a valid HTML attribute
                indeterminate={parentState === 'indeterminate' || undefined}
                onCheckedChange={() => handleParentToggle(parent)}
              />

              {/* Label */}
              <Label
                htmlFor={`cat-${parent._id}`}
                className="text-sm font-medium cursor-pointer flex-1"
              >
                {parent.name}
              </Label>
            </div>

            {/* Subcategories */}
            {hasChildren && isExpanded && (
              <div className="ml-5 space-y-1">
                {parent.subcategories!.map((child) => (
                  <div
                    key={child._id}
                    className="flex items-center space-x-2 pl-5"
                  >
                    {/* File Icon */}
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

                    {/* Checkbox */}
                    <Checkbox
                      id={`cat-${child._id}`}
                      checked={selectedCategories.includes(child._id)}
                      onCheckedChange={() => handleChildToggle(child._id)}
                    />

                    {/* Label */}
                    <Label
                      htmlFor={`cat-${child._id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {child.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
