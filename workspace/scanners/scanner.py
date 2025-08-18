import os


def main():
    temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "temp")
    print(os.listdir(temp_dir))
    for file in os.listdir(temp_dir):
        print(os.path.isdir(os.path.join(temp_dir, file)))
        if file.endswith(".py"):
            print("Found Python file:", file)


if __name__ == "__main__":
    main()

