import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../theme';

interface DraggableItem {
  id: string;
  [key: string]: any;
}

interface DraggableListProps<T extends DraggableItem> {
  data: T[];
  onReorder: (newData: T[]) => void;
  renderItem: (item: T) => React.ReactNode;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  emptyText?: string;
  containerStyle?: ViewStyle;
  scrollEnabled?: boolean;
}

export default function DraggableList<T extends DraggableItem>({
  data,
  onReorder,
  renderItem,
  onEdit,
  onDelete,
  emptyText = 'Aucun élément',
  containerStyle,
  scrollEnabled = true,
}: DraggableListProps<T>) {
  const handleDragEnd = ({ data: newData }: { data: T[] }) => {
    onReorder(newData);
  };

  const renderDraggableItem = ({ item, drag, isActive }: RenderItemParams<T>) => {
    return (
      <ScaleDecorator>
        <View
          style={[
            styles.itemContainer,
            isActive && styles.itemContainerActive,
          ]}
        >
          {/* Drag handle */}
          <TouchableOpacity
            onLongPress={drag}
            disabled={isActive}
            style={styles.dragHandle}
          >
            <Feather name="menu" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Contenu de l'item */}
          <View style={styles.itemContent}>{renderItem(item)}</View>

          {/* Actions */}
          <View style={styles.itemActions}>
            {onEdit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEdit(item)}
              >
                <Feather name="edit-2" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onDelete(item)}
              >
                <Feather name="trash-2" size={18} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScaleDecorator>
    );
  };

  if (data.length === 0) {
    return (
      <View style={[styles.emptyContainer, containerStyle]}>
        <Feather name="inbox" size={48} color={Colors.textDisabled} />
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <DraggableFlatList
        data={data}
        renderItem={renderDraggableItem}
        keyExtractor={(item) => item.id}
        onDragEnd={handleDragEnd}
        scrollEnabled={scrollEnabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  itemContainerActive: {
    opacity: 0.7,
    borderColor: Colors.primary,
  },
  dragHandle: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  itemContent: {
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginLeft: Spacing.md,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    color: Colors.textDisabled,
    marginTop: Spacing.md,
  },
});
