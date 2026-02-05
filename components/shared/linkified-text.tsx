import * as React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useRouter } from 'expo-router';

interface LinkifiedTextProps {
  children: string;
  style?: TextStyle;
}

/**
 * Renders text with clickable @mentions
 * Tapping a @username navigates to that user's profile
 */
export function LinkifiedText({ children, style }: LinkifiedTextProps) {
  const router = useRouter();

  const handleMentionPress = (username: string) => {
    // Navigate to user profile
    router.push(`/user/${username}`);
  };

  // Parse text and split into regular text and @mentions
  const parseText = (text: string) => {
    // Match @username (letters, numbers, underscores)
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`}>
            {text.slice(lastIndex, match.index)}
          </Text>
        );
      }

      // Add the clickable mention
      const username = match[1];
      parts.push(
        <Text
          key={`mention-${match.index}`}
          style={styles.mention}
          onPress={() => handleMentionPress(username)}
        >
          @{username}
        </Text>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last mention
    if (lastIndex < text.length) {
      parts.push(
        <Text key={`text-${lastIndex}`}>
          {text.slice(lastIndex)}
        </Text>
      );
    }

    return parts;
  };

  // If no @ symbols, just render plain text
  if (!children.includes('@')) {
    return <Text style={style}>{children}</Text>;
  }

  return <Text style={style}>{parseText(children)}</Text>;
}

const styles = StyleSheet.create({
  mention: {
    color: '#0095f6',
    fontWeight: '600',
  },
});
