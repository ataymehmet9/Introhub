'use client'

import React, { useState } from 'react'
import {
  HiBuildingOffice2,
  HiEllipsisVertical,
  HiEnvelope,
  HiPencil,
  HiPhone,
  HiTrash,
} from 'react-icons/hi2'
import { FaLinkedin } from 'react-icons/fa'
import { ConfirmationDialog, DateFormat } from '../common'
import type { ContactCardProps } from '@/@types/intro-hub'
import { Avatar, Card, Dropdown } from '@/components/ui'

const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onEdit,
  onDelete,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete(contact.id)
      }
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting contact:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Generate avatar color based on contact name
  const stringToColor = (string: string): string => {
    let hash = 0
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash)
    }
    let color = '#'
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff
      color += `00${value.toString(16)}`.slice(-2)
    }
    return color
  }

  const avatarColor = stringToColor(contact.name)

  const dropdownItems = [
    {
      key: 'edit',
      label: (
        <div className="flex items-center gap-2">
          <HiPencil className="text-lg" />
          <span>Edit</span>
        </div>
      ),
      onClick: () => onEdit(contact),
    },
    {
      key: 'delete',
      label: (
        <div className="flex items-center gap-2 text-red-600">
          <HiTrash className="text-lg" />
          <span>Delete</span>
        </div>
      ),
      onClick: handleDeleteClick,
    },
  ]

  return (
    <>
      <Card
        className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
        bodyClass="p-6"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <Avatar
              size={50}
              shape="circle"
              style={{ backgroundColor: avatarColor }}
              className="text-white font-semibold flex-shrink-0 p-4"
            >
              {contact.name.charAt(0)}
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {contact.name}
              </h3>
              {contact.position && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {contact.position}
                </p>
              )}
            </div>
          </div>

          <Dropdown
            renderTitle={
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                <HiEllipsisVertical className="text-xl text-gray-600 dark:text-gray-400" />
              </button>
            }
            placement="bottom-end"
          >
            {dropdownItems.map((item) => (
              <Dropdown.Item
                key={item.key}
                eventKey={item.key}
                onClick={item.onClick}
              >
                {item.label}
              </Dropdown.Item>
            ))}
          </Dropdown>
        </div>

        <div className="space-y-3 mb-4">
          {contact.company && (
            <div className="flex items-center gap-2 text-sm">
              <HiBuildingOffice2 className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">
                {contact.company}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <HiEnvelope className="text-gray-400 flex-shrink-0" />
            <a
              href={`mailto:${contact.email}`}
              className="text-blue-600 dark:text-blue-400 hover:underline truncate"
            >
              {contact.email}
            </a>
          </div>

          {contact.phone && (
            <div className="flex items-center gap-2 text-sm">
              <HiPhone className="text-gray-400 flex-shrink-0" />
              <a
                href={`tel:${contact.phone}`}
                className="text-gray-700 dark:text-gray-300 hover:underline"
              >
                {contact.phone}
              </a>
            </div>
          )}

          {contact.linkedinUrl && (
            <div className="flex items-center gap-2 text-sm">
              <FaLinkedin className="text-blue-600 flex-shrink-0" />
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline truncate"
              >
                LinkedIn Profile
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Added: <DateFormat date={contact.createdAt} format="short" />
          </div>
        </div>
      </Card>

      <ConfirmationDialog
        open={showDeleteDialog}
        title="Delete Contact"
        message={`Are you sure you want to delete ${contact.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  )
}

export default ContactCard
