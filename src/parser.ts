import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import TypeScript from "tree-sitter-typescript";

const TS = TypeScript.typescript;

export interface CodeEntity {
  name: string;
  type: "function" | "class" | "method";
  range: [number, number]; // [startIndex, endIndex]
}

export function extractEntities(source: string): CodeEntity[] {
  try {
    const parser = new Parser();
    console.log(parser)
    parser.setLanguage(TS);

    const tree = parser.parse(source);
    console.log(tree);
    const entities: CodeEntity[] = [];

    const visit = (node: Parser.SyntaxNode) => {
      if (!node) return;

      // function declaration
      if (node.type === "function_declaration" && node.firstChild) {
        const nameNode = node.childForFieldName("name");
        if (nameNode) {
          entities.push({
            name: nameNode.text,
            type: "function",
            range: [node.startIndex, node.endIndex],
          });
        }
      }

      // class
      if (node.type === "class_declaration") {
        const nameNode = node.childForFieldName("name");
        if (nameNode) {
          entities.push({
            name: nameNode.text,
            type: "class",
            range: [node.startIndex, node.endIndex],
          });
        }
      }

      // methods (inside classes/objects)
      if (node.type === "method_definition") {
        const nameNode = node.childForFieldName("name");
        if (nameNode) {
          entities.push({
            name: nameNode.text,
            type: "method",
            range: [node.startIndex, node.endIndex],
          });
        }
      }

      for (const child of node.children) {
        visit(child);
      }
    };

    visit(tree.rootNode);
    return entities;
  } catch (error) {
    console.log(error);
    return [];
  }
}
